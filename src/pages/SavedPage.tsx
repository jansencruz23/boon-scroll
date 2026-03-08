import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
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

const CATEGORY_STYLES: Record<string, string> = {
  FREE_CERTIFICATION: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  PROMO_OR_TRIAL: "bg-green-500/10 text-green-400 border-green-500/20",
  TECH_UPDATE: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  NOT_RELEVANT: "bg-red-500/10 text-red-400 border-red-500/20",
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
    let query = supabase.from("articles").select("*").eq("user_id", user.id).eq("is_saved", true).order("fetched_at", { ascending: false });
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
    toast({ title: "Removed from saved" });
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied!" });
  };

  return (
    <div className="max-w-[680px] mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5 animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold">Saved</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{articles.length} saved articles</p>
        </div>
      </div>

      <div className="relative mb-5 animate-fade-in">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search saved articles…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 bg-muted border-border"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl border border-border bg-card animate-pulse-subtle" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="text-5xl mb-4 animate-float">🔖</div>
          <h3 className="font-display font-semibold text-lg mb-2">No saved articles</h3>
          <p className="text-sm text-muted-foreground">Bookmark articles from your feed to read later.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article, i) => {
            const cat = categories.find((c) => c.name === article.category_name);
            const catStyle = CATEGORY_STYLES[article.category_name] ?? "bg-purple-500/10 text-purple-400 border-purple-500/20";
            const timeAgo = article.published_at
              ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true })
              : formatDistanceToNow(new Date(article.fetched_at), { addSuffix: true });
            return (
              <div
                key={article.id}
                className="rounded-xl border border-border bg-card p-4 card-hover animate-fade-in-up"
                style={{ animationDelay: `${i * 40}ms`, animationFillMode: "forwards" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", catStyle)}>
                        {cat?.emoji ?? "📌"} {cat?.display_name ?? article.category_name}
                      </span>
                      <span className="text-xs text-muted-foreground">{timeAgo}</span>
                    </div>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-sm text-foreground hover:text-primary transition-colors leading-snug"
                    >
                      {article.title}
                    </a>
                    {article.content_preview && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{article.content_preview}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => copyLink(article.url)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <button
                      onClick={() => unsave(article.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
