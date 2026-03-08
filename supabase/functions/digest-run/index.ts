import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function stripHtml(html: string): string {
  return html
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, (m) => m.slice(9, -3))
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, "").replace(/\s{2,}/g, " ").trim();
}

async function parseRSS(url: string): Promise<Array<{ title: string; link: string; description: string; pubDate: string; author: string }>> {
  const res = await fetch(url, {
    headers: { "User-Agent": "BoonScroll/1.0 RSS Reader" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const xml = await res.text();

  const items: Array<{ title: string; link: string; description: string; pubDate: string; author: string }> = [];

  // Parse <item> or <entry> blocks
  const itemRegex = /<(?:item|entry)[\s>]([\s\S]*?)<\/(?:item|entry)>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const get = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i"));
      return m ? m[1].trim() : "";
    };
    const getLinkAtom = () => {
      const m = block.match(/<link[^>]+href=["']([^"']+)["']/i);
      return m ? m[1] : get("link");
    };
    items.push({
      title: get("title").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#\d+;/g, ""),
      link: getLinkAtom() || get("link"),
      description: get("description") || get("summary") || get("content"),
      pubDate: get("pubDate") || get("published") || get("updated") || "",
      author: get("author") || get("dc:creator") || "",
    });
    if (items.length >= 30) break;
  }
  return items;
}

async function classifyWithGemini(
  apiKey: string,
  article: { title: string; description: string },
  categories: Array<{ name: string; display_name: string; description: string; priority: number }>,
  interests: string,
  strictness: string,
  retries = 3
): Promise<{ category: string; confidence: number; reason: string; priority: number; tags: string[]; is_relevant: boolean }> {
  const catList = categories.map((c) => `- ${c.name} (${c.display_name}): ${c.description}`).join("\n");
  const prompt = `You are an AI content classifier for a tech news digest app.

User interests: ${interests || "general tech"}
Strictness: ${strictness}

Available categories:
${catList}

Classify this article and return ONLY valid JSON (no markdown, no explanation):
{
  "category": "<one of the category names above>",
  "confidence": <0.0-1.0>,
  "reason": "<1 sentence why>",
  "priority": <1-5, 1=highest>,
  "tags": ["tag1", "tag2"],
  "is_relevant": <true if not NOT_RELEVANT and confidence >= ${strictness === "strict" ? 0.6 : 0.4}>
}

Article title: ${article.title}
Article preview: ${article.description?.slice(0, 300) ?? ""}`;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
          }),
          signal: AbortSignal.timeout(30000),
        }
      );

      if (res.status === 429) {
        const waitMs = [5000, 10000, 20000][attempt] ?? 20000;
        console.log(`Rate limited, waiting ${waitMs}ms`);
        await sleep(waitMs);
        continue;
      }

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini error ${res.status}: ${err.slice(0, 200)}`);
      }

      const data = await res.json();
      const finishReason = data.candidates?.[0]?.finishReason;
      if (finishReason === "SAFETY" || finishReason === "BLOCKED") {
        return { category: "NOT_RELEVANT", confidence: 0, reason: "Safety filter", priority: 5, tags: [], is_relevant: false };
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      return JSON.parse(cleaned);
    } catch (e) {
      if (attempt === retries - 1) {
        console.error("Gemini classification failed:", e);
        return { category: "NOT_RELEVANT", confidence: 0, reason: "Classification failed", priority: 5, tags: [], is_relevant: false };
      }
      await sleep(2000 * (attempt + 1));
    }
  }
  return { category: "NOT_RELEVANT", confidence: 0, reason: "All retries failed", priority: 5, tags: [], is_relevant: false };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }

  console.log(`Starting digest run for user ${user.id}`);

  // Create run record
  const { data: runData, error: runErr } = await supabase
    .from("digest_runs")
    .insert({ user_id: user.id, status: "running", trigger: "manual" })
    .select()
    .single();

  if (runErr || !runData) {
    return new Response(JSON.stringify({ error: "Failed to create run" }), { status: 500, headers: corsHeaders });
  }

  const runId = runData.id;

  try {
    // Fetch profile, sources, categories
    const [profileRes, sourcesRes, categoriesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("sources").select("*").eq("user_id", user.id).eq("is_active", true),
      supabase.from("categories").select("*").eq("user_id", user.id).eq("is_active", true),
    ]);

    const profile = profileRes.data;
    const sources = sourcesRes.data ?? [];
    const categories = categoriesRes.data ?? [];

    if (!profile?.gemini_api_key) {
      await supabase.from("digest_runs").update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_log: [{ error: "No Gemini API key configured" }],
      }).eq("id", runId);
      return new Response(JSON.stringify({ error: "No Gemini API key" }), { status: 400, headers: corsHeaders });
    }

    let totalFetched = 0;
    let totalPassed = 0;
    let totalErrors = 0;
    const errorLog: Array<{ source: string; error: string }> = [];

    for (const source of sources) {
      console.log(`Fetching source: ${source.name}`);
      let items: Awaited<ReturnType<typeof parseRSS>> = [];

      try {
        items = await parseRSS(source.rss_url);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`Failed to fetch ${source.name}: ${msg}`);
        errorLog.push({ source: source.name, error: msg });
        totalErrors++;
        await supabase.from("sources").update({ last_fetched_at: new Date().toISOString() }).eq("id", source.id);
        continue;
      }

      console.log(`${source.name}: ${items.length} items found`);

      // Deduplicate: get existing URLs for this user+source
      const urls = items.map((i) => i.link).filter(Boolean);
      const { data: existing } = await supabase
        .from("articles")
        .select("url")
        .eq("user_id", user.id)
        .in("url", urls);

      const existingUrls = new Set((existing ?? []).map((e: { url: string }) => e.url));
      const newItems = items.filter((i) => i.link && !existingUrls.has(i.link));

      console.log(`${source.name}: ${newItems.length} new articles to classify`);
      totalFetched += newItems.length;

      let sourcePassed = 0;
      for (const item of newItems) {
        if (!item.title || !item.link) continue;

        const classification = await classifyWithGemini(
          profile.gemini_api_key!,
          { title: item.title, description: item.description?.replace(/<[^>]+>/g, "").slice(0, 500) ?? "" },
          categories,
          profile.interest_keywords ?? "",
          profile.strictness,
        );

        const catRecord = categories.find((c: { name: string }) => c.name === classification.category);

        const { error: insertError } = await supabase.from("articles").upsert({
          user_id: user.id,
          source_id: source.id,
          title: item.title.slice(0, 500),
          url: item.link,
          content_preview: item.description?.replace(/<[^>]+>/g, "").slice(0, 300) ?? "",
          author: item.author?.slice(0, 200) ?? "",
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
          category_id: catRecord?.id ?? null,
          category_name: classification.category,
          confidence: classification.confidence,
          ai_reason: classification.reason,
          priority: classification.priority,
          tags: classification.tags ?? [],
          is_relevant: classification.is_relevant,
        }, { onConflict: "user_id,url" });

        if (!insertError && classification.is_relevant) sourcePassed++;
        if (insertError) {
          console.error("Insert error:", insertError.message);
          errorLog.push({ source: source.name, error: insertError.message });
          totalErrors++;
        }

        // Rate limit: delay between Gemini calls
        await sleep(1200);
      }

      totalPassed += sourcePassed;

      // Update source stats
      await supabase.from("sources").update({
        last_fetched_at: new Date().toISOString(),
        last_fetch_count: newItems.length,
        last_pass_count: sourcePassed,
      }).eq("id", source.id);
    }

    // Mark run complete
    await supabase.from("digest_runs").update({
      status: "completed",
      completed_at: new Date().toISOString(),
      total_fetched: totalFetched,
      total_passed: totalPassed,
      total_errors: totalErrors,
      error_log: errorLog,
    }).eq("id", runId);

    return new Response(
      JSON.stringify({ success: true, total_fetched: totalFetched, total_passed: totalPassed, total_errors: totalErrors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Digest run failed:", msg);
    await supabase.from("digest_runs").update({
      status: "failed",
      completed_at: new Date().toISOString(),
      error_log: [{ error: msg }],
    }).eq("id", runId);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: corsHeaders });
  }
});
