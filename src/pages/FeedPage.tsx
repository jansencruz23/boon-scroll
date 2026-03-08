import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Bookmark, BookmarkCheck, ThumbsUp, ThumbsDown, Copy, ExternalLink,
  Search, AlertCircle, Radio, ChevronDown, ChevronUp, Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Article {
  id: string;
  title: string;
  url: string;
  content_preview: string;
  author: string;
  published_at: string | null;
  fetched_at: string;
  category_name: string;
  confidence: number;
  ai_reason: string;
  priority: number;
  tags: string[];
  is_relevant: boolean;
  is_saved: boolean;
  feedback: string | null;
  source_id: string;
}

interface Category {
  id: string;
  name: string;
  display_name: string;
  emoji: string;
  color: string;
}

const CATEGORY_BG: Record<string, string> = {
  FREE_CERTIFICATION: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  PROMO_OR_TRIAL: "bg-green-500/10 text-green-400 border-green-500/20",
  TECH_UPDATE: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  NOT_RELEVANT: "bg-red-500/10 text-red-400 border-red-500/20",
};

function ArticleSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3 animate-pulse-subtle">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16 ml-auto" />
      </div>
      <Skeleton className="h-5 w-4/5" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

function ArticleCard({ article, categories, onUpdate }: { article: Article; categories: Category[]; onUpdate: (id: string, updates: Partial<Article>) => void }) {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  const cat = categories.find((c) => c.name === article.category_name);
  const catStyle = CATEGORY_BG[article.category_name] ?? "bg-purple-500/10 text-purple-400 border-purple-500/20";
  const timeAgo = article.published_at
    ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true })
    : formatDistanceToNow(new Date(article.fetched_at), { addSuffix: true });

  const toggleSave = async () => {
    const newVal = !article.is_saved;
    onUpdate(article.id, { is_saved: newVal });
    await supabase.from("articles").update({ is_saved: newVal }).eq("id", article.id);
  };

  const setFeedback = async (val: "good" | "bad" | null) => {
    const newVal = article.feedback === val ? null : val;
    onUpdate(article.id, { feedback: newVal });
    await supabase.from("articles").update({ feedback: newVal }).eq("id", article.id);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(article.url);
    toast({ title: "Link copied!" });
  };

  const confidence = Math.round(article.confidence * 100);

  return (
    <div className={cn(
      "rounded-xl border bg-card overflow-hidden card-hover opacity-0 animate-fade-in-up",
      article.is_relevant ? "border-border" : "border-border/50 opacity-60"
    )} style={{ animationFillMode: "forwards" }}>
      <div className="p-5">
        {/* Meta row */}
        <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
          <div className="w-3.5 h-3.5 rounded-full bg-muted/80 flex items-center justify-center">
            <Radio className="h-2 w-2" />
          </div>
          <span className="font-medium">{article.source_id?.slice(0, 8) ?? "Unknown"}</span>
          <span className="text-muted-foreground/50">·</span>
          <span>{timeAgo}</span>
          <div className="ml-auto flex items-center gap-1.5">
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", catStyle)}>
              {cat?.emoji ?? "📌"} {cat?.display_name ?? article.category_name}
            </span>
            <span className="text-muted-foreground/60 text-xs">{confidence}%</span>
          </div>
        </div>

        {/* Title */}
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block font-semibold text-foreground hover:text-primary transition-colors leading-snug mb-2 group"
        >
          {article.title}
          <ExternalLink className="inline ml-1.5 h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
        </a>

        {/* Preview */}
        {article.content_preview && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{article.content_preview}</p>
        )}

        {/* Tags */}
        {article.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {article.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">{tag}</span>
            ))}
          </div>
        )}

        {/* AI Reason (expandable) */}
        {article.ai_reason && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3 group"
          >
            <span className="text-primary/60">✦</span>
            <span className={cn("transition-all", expanded ? "" : "line-clamp-1")}>{article.ai_reason}</span>
            {expanded ? <ChevronUp className="h-3 w-3 flex-shrink-0" /> : <ChevronDown className="h-3 w-3 flex-shrink-0" />}
          </button>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 -mx-1 mt-1">
          <button
            onClick={toggleSave}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
              article.is_saved
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            {article.is_saved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
            {article.is_saved ? "Saved" : "Save"}
          </button>
          <button
            onClick={() => setFeedback("good")}
            className={cn(
              "flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-all duration-200",
              article.feedback === "good"
                ? "text-green-400 bg-green-500/10"
                : "text-muted-foreground hover:text-green-400 hover:bg-green-500/10"
            )}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setFeedback("bad")}
            className={cn(
              "flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-all duration-200",
              article.feedback === "bad"
                ? "text-red-400 bg-red-500/10"
                : "text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
            )}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={copyLink}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 ml-auto"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "confidence">("newest");
  const [showRelevantOnly, setShowRelevantOnly] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;
  const { user, profile } = useAuth();

  const fetchArticles = useCallback(async (pageNum = 0, replace = false) => {
    if (!user) return;
    setLoading(true);
    let query = supabase
      .from("articles")
      .select("*")
      .eq("user_id", user.id)
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

    if (activeCategory !== "all") query = query.eq("category_name", activeCategory);
    if (showRelevantOnly) query = query.eq("is_relevant", true);
    if (search) query = query.ilike("title", `%${search}%`);
    if (sort === "newest") query = query.order("fetched_at", { ascending: false });
    else query = query.order("confidence", { ascending: false });

    const { data, error } = await query;
    if (!error && data) {
      if (replace) setArticles(data as Article[]);
      else setArticles((prev) => [...prev, ...(data as Article[])]);
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoading(false);
  }, [user, activeCategory, showRelevantOnly, search, sort]);

  useEffect(() => {
    setPage(0);
    fetchArticles(0, true);
  }, [activeCategory, showRelevantOnly, search, sort]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("articles-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "articles", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setArticles((prev) => [payload.new as Article, ...prev]);
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    supabase.from("categories").select("*").eq("user_id", user.id).then(({ data }) => {
      if (data) setCategories(data as Category[]);
    });
  }, [user]);

  const updateArticle = (id: string, updates: Partial<Article>) => {
    setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchArticles(nextPage);
  };

  const noGeminiKey = profile && !profile.gemini_api_key;

  return (
    <div className="max-w-[680px] mx-auto px-4 py-6">
      {/* Banner: No API key */}
      {noGeminiKey && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 text-sm animate-fade-in">
          <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0" />
          <span className="text-yellow-300">Add your Gemini API key in <Link to="/settings" className="font-medium underline underline-offset-2">Settings</Link> to start classifying articles.</span>
        </div>
      )}

      {/* Page title */}
      <div className="mb-5 animate-fade-in-up">
        <h1 className="font-display text-2xl font-bold mb-0.5">Your Feed</h1>
        <p className="text-sm text-muted-foreground">{articles.length > 0 ? `${articles.length} articles` : "No articles yet"}</p>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm pb-4 mb-2 -mx-4 px-4 pt-1 animate-fade-in">
        {/* Category tabs */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-thin pb-2 mb-3">
          {[{ name: "all", display_name: "All", emoji: "✨" }, { name: "HACKATHON", display_name: "Hackathons", emoji: "🏆" }, ...categories].map((cat) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap",
                activeCategory === cat.name
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {cat.emoji} {cat.display_name}
            </button>
          ))}
        </div>

        {/* Search + sort row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search articles…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm bg-muted border-border"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSort(sort === "newest" ? "confidence" : "newest")}
            className="h-8 text-xs gap-1.5 border-border"
          >
            {sort === "newest" ? "Newest" : "Confidence"}
          </Button>
          <Button
            variant={showRelevantOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowRelevantOnly(!showRelevantOnly)}
            className={cn("h-8 text-xs gap-1.5 border-border", showRelevantOnly && "shadow-glow")}
          >
            <Filter className="h-3 w-3" /> Relevant
          </Button>
        </div>
      </div>

      {/* Articles */}
      <div className="space-y-3">
        {loading && articles.length === 0 ? (
          Array.from({ length: 5 }).map((_, i) => <ArticleSkeleton key={i} />)
        ) : articles.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="text-5xl mb-4 animate-float">📭</div>
            <h3 className="font-display font-semibold text-lg mb-2">Nothing here yet</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Add some sources and run your first digest to see articles.
            </p>
            <div className="flex gap-3 justify-center">
              <Button asChild variant="outline" size="sm">
                <Link to="/sources">Add Sources</Link>
              </Button>
            </div>
          </div>
        ) : (
          articles.map((article, i) => (
            <div key={article.id} style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}>
              <ArticleCard article={article} categories={categories} onUpdate={updateArticle} />
            </div>
          ))
        )}

        {hasMore && articles.length > 0 && (
          <Button
            variant="outline"
            className="w-full"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? <><Skeleton className="h-4 w-4 rounded-full mr-2" /> Loading…</> : "Load more"}
          </Button>
        )}
      </div>
    </div>
  );
}
