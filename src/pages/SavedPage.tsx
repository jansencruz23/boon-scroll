import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { BookmarkCheck, ExternalLink, Copy, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Article {
  id: string;
  title: string;
  url: string;
  content_preview: string;
  category_name: string;
  confidence: number;
  fetched_at: string;
  published_at: string | null;
  is_saved: boolean;
}

interface Category {
  id: string;
  name: string;
  display_name: string;
  emoji: string;
  color: string;
}

const CAT_STYLES: Record<string, string> = {
  FREE_CERTIFICATION: "text-cat-cert",
  PROMO_OR_TRIAL:    "text-cat-promo",
  TECH_UPDATE:       "text-cat-tech",
  NOT_RELEVANT:      "text-cat-bad",
  HACKATHON:         "text-cat-hackathon",
};

export default function SavedPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSaved = useCallback(async () => {
    if (!user) return;
    let query = supabase
      .from("articles")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_saved", true)
      .order("fetched_at", { ascending: false });
    if (search) query = query.ilike("title", `%${search}%`);
    const { data } = await query;
    if (data) setArticles(data as Article[]);
    setLoading(false);
  }, [user, search]);

  useEffect(() => { fetchSaved(); }, [fetchSaved]);
  useEffect(() => {
    if (!user) return;
    supabase.from("categories").select("*").eq("user_id", user.id).then(({ data }) => {
      if (data) setCategories(data as Category[]);
    });
  }, [user]);

  const unsave = async (id: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
    await supabase.from("articles").update({ is_saved: false }).eq("id", id);
    toast({ title: "Removed" });
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Copied" });
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-6 animate-fade-in-up">
        <h1 className="text-xl font-semibold tracking-tight">Saved</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{articles.length} articles</p>
      </div>

      <div className="relative mb-6 animate-fade-in">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <Input
          placeholder="Search saved…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-7 h-8 text-sm bg-muted border-border"
        />
      </div>

      {loading ? (
        <div className="space-y-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="py-4 border-b border-border animate-pulse-subtle space-y-2">
              <div className="h-3 bg-muted rounded w-24" />
              <div className="h-4 bg-muted rounded w-4/5" />
              <div className="h-3 bg-muted rounded w-full" />
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-24 animate-fade-in">
          <p className="text-3xl mb-4 animate-float">∅</p>
          <h3 className="text-sm font-semibold mb-1.5 tracking-tight">No saved articles</h3>
          <p className="text-xs text-muted-foreground">Bookmark articles from your feed to read later.</p>
        </div>
      ) : (
        <div>
          {articles.map((article, i) => {
            const cat = categories.find((c) => c.name === article.category_name);
            const catLabel = CAT_STYLES[article.category_name] ?? "text-muted-foreground";
            const timeAgo = article.published_at
              ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true })
              : formatDistanceToNow(new Date(article.fetched_at), { addSuffix: true });

            return (
              <article
                key={article.id}
                className="group py-4 border-b border-border last:border-0 opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${i * 30}ms`, animationFillMode: "forwards" }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={cn("text-[11px] font-medium", catLabel)}>
                        {cat?.display_name ?? article.category_name}
                      </span>
                      <span className="text-[11px] text-muted-foreground/50">·</span>
                      <span className="text-[11px] text-muted-foreground">{timeAgo}</span>
                    </div>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm font-semibold tracking-tight text-foreground hover:text-foreground/80 transition-colors leading-snug mb-1"
                    >
                      {article.title}
                    </a>
                    {article.content_preview && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {article.content_preview}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <button
                      onClick={() => copyLink(article.url)}
                      className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-150"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-150"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <button
                      onClick={() => unsave(article.id)}
                      className="p-1.5 rounded text-muted-foreground hover:text-cat-bad hover:bg-cat-bad/10 transition-all duration-150"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
