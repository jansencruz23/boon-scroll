import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Bookmark, BookmarkCheck, ThumbsUp, ThumbsDown, Copy, ExternalLink,
  Search, AlertCircle, ChevronDown, ChevronUp, Filter, ArrowUpDown
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

const CATEGORY_STYLES: Record<string, { dot: string; label: string }> = {
  FREE_CERTIFICATION: { dot: "bg-cat-cert", label: "text-cat-cert" },
  PROMO_OR_TRIAL:    { dot: "bg-cat-promo", label: "text-cat-promo" },
  TECH_UPDATE:       { dot: "bg-cat-tech", label: "text-cat-tech" },
  NOT_RELEVANT:      { dot: "bg-cat-bad", label: "text-cat-bad" },
  HACKATHON:         { dot: "bg-cat-hackathon", label: "text-cat-hackathon" },
};

function ArticleSkeleton() {
  return (
    <div className="py-4 border-b border-border last:border-0 space-y-2.5 animate-pulse-subtle">
      <div className="flex items-center gap-2">
        <Skeleton className="h-2 w-2 rounded-full" />
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-16 ml-auto" />
      </div>
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

function ArticleCard({
  article,
  categories,
  onUpdate,
}: {
  article: Article;
  categories: Category[];
  onUpdate: (id: string, updates: Partial<Article>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  const cat = categories.find((c) => c.name === article.category_name);
  const catStyle = CATEGORY_STYLES[article.category_name] ?? { dot: "bg-cat-other", label: "text-muted-foreground" };
  const timeAgo = article.published_at
    ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true })
    : formatDistanceToNow(new Date(article.fetched_at), { addSuffix: true });
  const confidence = Math.round(article.confidence * 100);

  const toggleSave = async () => {
    const newVal = !article.is_saved;
    onUpdate(article.id, { is_saved: newVal });
    await supabase.from("articles").update({ is_saved: newVal }).eq("id", article.id);
  };

  const setFeedback = async (val: "good" | "bad") => {
    const newVal = article.feedback === val ? null : val;
    onUpdate(article.id, { feedback: newVal });
    await supabase.from("articles").update({ feedback: newVal }).eq("id", article.id);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(article.url);
    toast({ title: "Copied" });
  };

  return (
    <article
      className={cn(
        "group py-4 border-b border-border last:border-0 opacity-0 animate-fade-in-up",
        !article.is_relevant && "opacity-40"
      )}
      style={{ animationFillMode: "forwards" }}
    >
      {/* Meta line */}
      <div className="flex items-center gap-2 mb-2 text-[11px] text-muted-foreground">
        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", catStyle.dot)} />
        <span className={cn("font-medium", catStyle.label)}>
          {cat?.display_name ?? article.category_name}
        </span>
        <span className="text-muted-foreground/40">·</span>
        <span>{timeAgo}</span>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground/50">{confidence}%</span>
      </div>

      {/* Title */}
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-sm font-semibold text-foreground hover:text-foreground/80 transition-colors leading-snug mb-1.5 tracking-tight"
      >
        {article.title}
      </a>

      {/* Preview */}
      {article.content_preview && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">
          {article.content_preview}
        </p>
      )}

      {/* Tags */}
      {article.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {article.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* AI reason */}
      {article.ai_reason && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-start gap-1.5 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors mb-2 text-left w-full"
        >
          <span className="flex-shrink-0 mt-px">—</span>
          <span className={cn("leading-relaxed", !expanded && "line-clamp-1")}>{article.ai_reason}</span>
          {expanded
            ? <ChevronUp className="h-3 w-3 flex-shrink-0 mt-px" />
            : <ChevronDown className="h-3 w-3 flex-shrink-0 mt-px" />
          }
        </button>
      )}

      {/* Actions — only show on hover on desktop, always on mobile */}
      <div className="flex items-center gap-0.5 -ml-1.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 md:opacity-0 max-md:opacity-100">
        <button
          onClick={toggleSave}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium transition-all duration-150",
            article.is_saved
              ? "text-foreground bg-accent"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          {article.is_saved
            ? <BookmarkCheck className="h-3 w-3" />
            : <Bookmark className="h-3 w-3" />}
          {article.is_saved ? "Saved" : "Save"}
        </button>
        <button
          onClick={() => setFeedback("good")}
          className={cn(
            "p-1.5 rounded transition-all duration-150",
            article.feedback === "good"
              ? "text-cat-promo bg-cat-promo/10"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <ThumbsUp className="h-3 w-3" />
        </button>
        <button
          onClick={() => setFeedback("bad")}
          className={cn(
            "p-1.5 rounded transition-all duration-150",
            article.feedback === "bad"
              ? "text-cat-bad bg-cat-bad/10"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <ThumbsDown className="h-3 w-3" />
        </button>
        <button
          onClick={copyLink}
          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-150 ml-auto"
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
      </div>
    </article>
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
        (payload) => { setArticles((prev) => [payload.new as Article, ...prev]); })
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
    const next = page + 1;
    setPage(next);
    fetchArticles(next);
  };

  const noGeminiKey = profile && !profile.gemini_api_key;

  const STATIC_TABS = [
    { name: "all", display_name: "All" },
    { name: "HACKATHON", display_name: "Hackathons" },
  ];
  const allTabs = [...STATIC_TABS, ...categories.map((c) => ({ name: c.name, display_name: c.display_name }))];

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* API key warning */}
      {noGeminiKey && (
        <div className="mb-6 flex items-center gap-3 rounded-md border border-border bg-muted/50 px-4 py-3 text-xs animate-fade-in">
          <AlertCircle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground">
            Add your Gemini API key in{" "}
            <Link to="/settings" className="text-foreground underline underline-offset-2">Settings</Link>{" "}
            to start classifying articles.
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 animate-fade-in-up">
        <h1 className="text-xl font-semibold tracking-tight mb-0.5">Feed</h1>
        <p className="text-xs text-muted-foreground">
          {articles.length > 0 ? `${articles.length} articles` : "No articles yet"}
        </p>
      </div>

      {/* Sticky filters */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-4 mb-1 -mx-6 px-6 pt-1 border-b border-border/50 animate-fade-in">
        {/* Category tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-thin pb-3 mb-3 no-scrollbar">
          {allTabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveCategory(tab.name)}
              className={cn(
                "flex-shrink-0 px-2.5 py-1 rounded text-xs font-medium transition-all duration-150 whitespace-nowrap",
                activeCategory === tab.name
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {tab.display_name}
            </button>
          ))}
        </div>

        {/* Search + controls */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 h-7 text-xs bg-muted border-border rounded"
            />
          </div>
          <button
            onClick={() => setSort(sort === "newest" ? "confidence" : "newest")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 h-7 rounded text-xs font-medium border transition-all duration-150",
              "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <ArrowUpDown className="h-3 w-3" />
            {sort === "newest" ? "Newest" : "Confidence"}
          </button>
          <button
            onClick={() => setShowRelevantOnly(!showRelevantOnly)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 h-7 rounded text-xs font-medium border transition-all duration-150",
              showRelevantOnly
                ? "border-foreground/30 bg-foreground/5 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <Filter className="h-3 w-3" />
            Relevant
          </button>
        </div>
      </div>

      {/* Article list */}
      <div>
        {loading && articles.length === 0 ? (
          Array.from({ length: 6 }).map((_, i) => <ArticleSkeleton key={i} />)
        ) : articles.length === 0 ? (
          <div className="text-center py-24 animate-fade-in">
            <p className="text-3xl mb-4 animate-float">∅</p>
            <h3 className="text-sm font-semibold mb-1.5 tracking-tight">Nothing here yet</h3>
            <p className="text-xs text-muted-foreground mb-5">
              Add sources and run your first digest.
            </p>
            <Button asChild variant="outline" size="sm" className="text-xs h-7">
              <Link to="/sources">Add sources</Link>
            </Button>
          </div>
        ) : (
          <>
            {articles.map((article, i) => (
              <div key={article.id} style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
                <ArticleCard article={article} categories={categories} onUpdate={updateArticle} />
              </div>
            ))}

            {hasMore && (
              <div className="pt-4 pb-2">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="w-full py-2 text-xs text-muted-foreground hover:text-foreground border border-border rounded hover:bg-accent transition-all duration-150 disabled:opacity-40"
                >
                  {loading ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
