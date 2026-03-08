import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Plus, Trash2, Edit2, Loader2, Radio, Globe, Hash, X, Sparkles, ChevronDown, ChevronUp, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Source {
  id: string;
  name: string;
  type: string;
  url: string;
  rss_url: string;
  category_tags: string[];
  is_active: boolean;
  last_fetched_at: string | null;
  last_fetch_count: number;
  last_pass_count: number;
  created_at: string;
}

const TYPE_ICONS = { rss: Radio, subreddit: Hash, website: Globe };
const TYPE_LABELS = { rss: "RSS", subreddit: "Subreddit", website: "Website" };

const PRESET_GROUPS: { label: string; emoji: string; sources: { name: string; type: string; url: string; rss_url: string }[] }[] = [
  {
    label: "Tech News",
    emoji: "🚀",
    sources: [
      { name: "Hacker News", type: "rss", url: "https://news.ycombinator.com", rss_url: "https://news.ycombinator.com/rss" },
      { name: "TechCrunch", type: "rss", url: "https://techcrunch.com", rss_url: "https://techcrunch.com/feed/" },
      { name: "The Verge", type: "rss", url: "https://theverge.com", rss_url: "https://www.theverge.com/rss/index.xml" },
      { name: "Wired", type: "rss", url: "https://wired.com", rss_url: "https://www.wired.com/feed/rss" },
      { name: "Ars Technica", type: "rss", url: "https://arstechnica.com", rss_url: "https://feeds.arstechnica.com/arstechnica/index" },
      { name: "MIT Technology Review", type: "rss", url: "https://technologyreview.com", rss_url: "https://www.technologyreview.com/feed/" },
      { name: "VentureBeat", type: "rss", url: "https://venturebeat.com", rss_url: "https://venturebeat.com/feed/" },
      { name: "ZDNet", type: "rss", url: "https://zdnet.com", rss_url: "https://www.zdnet.com/news/rss.xml" },
    ],
  },
  {
    label: "AI & Machine Learning",
    emoji: "🤖",
    sources: [
      { name: "OpenAI Blog", type: "rss", url: "https://openai.com/blog", rss_url: "https://openai.com/blog/rss.xml" },
      { name: "Google AI Blog", type: "rss", url: "https://ai.googleblog.com", rss_url: "https://ai.googleblog.com/feeds/posts/default" },
      { name: "Hugging Face Blog", type: "rss", url: "https://huggingface.co/blog", rss_url: "https://huggingface.co/blog/feed.xml" },
      { name: "Towards Data Science", type: "rss", url: "https://towardsdatascience.com", rss_url: "https://towardsdatascience.com/feed" },
      { name: "The Gradient", type: "rss", url: "https://thegradient.pub", rss_url: "https://thegradient.pub/rss/" },
      { name: "Import AI (Jack Clark)", type: "rss", url: "https://jack-clark.net", rss_url: "https://jack-clark.net/feed/" },
    ],
  },
  {
    label: "Developer",
    emoji: "💻",
    sources: [
      { name: "Dev.to", type: "rss", url: "https://dev.to", rss_url: "https://dev.to/feed" },
      { name: "freeCodeCamp", type: "rss", url: "https://freecodecamp.org/news", rss_url: "https://www.freecodecamp.org/news/rss/" },
      { name: "CSS-Tricks", type: "rss", url: "https://css-tricks.com", rss_url: "https://css-tricks.com/feed/" },
      { name: "Smashing Magazine", type: "rss", url: "https://smashingmagazine.com", rss_url: "https://www.smashingmagazine.com/feed/" },
      { name: "GitHub Blog", type: "rss", url: "https://github.blog", rss_url: "https://github.blog/feed/" },
      { name: "Stack Overflow Blog", type: "rss", url: "https://stackoverflow.blog", rss_url: "https://stackoverflow.blog/feed/" },
      { name: "A List Apart", type: "rss", url: "https://alistapart.com", rss_url: "https://alistapart.com/main/feed/" },
      { name: "Paul Graham Essays", type: "rss", url: "http://paulgraham.com", rss_url: "http://www.aaronsw.com/2002/feeds/pgessays.rss" },
    ],
  },
  {
    label: "Reddit — Tech",
    emoji: "🟠",
    sources: [
      { name: "r/programming", type: "subreddit", url: "https://reddit.com/r/programming", rss_url: "https://www.reddit.com/r/programming/.rss" },
      { name: "r/webdev", type: "subreddit", url: "https://reddit.com/r/webdev", rss_url: "https://www.reddit.com/r/webdev/.rss" },
      { name: "r/javascript", type: "subreddit", url: "https://reddit.com/r/javascript", rss_url: "https://www.reddit.com/r/javascript/.rss" },
      { name: "r/typescript", type: "subreddit", url: "https://reddit.com/r/typescript", rss_url: "https://www.reddit.com/r/typescript/.rss" },
      { name: "r/reactjs", type: "subreddit", url: "https://reddit.com/r/reactjs", rss_url: "https://www.reddit.com/r/reactjs/.rss" },
      { name: "r/Python", type: "subreddit", url: "https://reddit.com/r/Python", rss_url: "https://www.reddit.com/r/Python/.rss" },
      { name: "r/devops", type: "subreddit", url: "https://reddit.com/r/devops", rss_url: "https://www.reddit.com/r/devops/.rss" },
      { name: "r/netsec", type: "subreddit", url: "https://reddit.com/r/netsec", rss_url: "https://www.reddit.com/r/netsec/.rss" },
    ],
  },
  {
    label: "Reddit — AI",
    emoji: "🤖",
    sources: [
      { name: "r/artificial", type: "subreddit", url: "https://reddit.com/r/artificial", rss_url: "https://www.reddit.com/r/artificial/.rss" },
      { name: "r/LocalLLaMA", type: "subreddit", url: "https://reddit.com/r/LocalLLaMA", rss_url: "https://www.reddit.com/r/LocalLLaMA/.rss" },
      { name: "r/MachineLearning", type: "subreddit", url: "https://reddit.com/r/MachineLearning", rss_url: "https://www.reddit.com/r/MachineLearning/.rss" },
      { name: "r/ChatGPT", type: "subreddit", url: "https://reddit.com/r/ChatGPT", rss_url: "https://www.reddit.com/r/ChatGPT/.rss" },
      { name: "r/OpenAI", type: "subreddit", url: "https://reddit.com/r/OpenAI", rss_url: "https://www.reddit.com/r/OpenAI/.rss" },
      { name: "r/singularity", type: "subreddit", url: "https://reddit.com/r/singularity", rss_url: "https://www.reddit.com/r/singularity/.rss" },
    ],
  },
  {
    label: "Reddit — Deals & Free",
    emoji: "💰",
    sources: [
      { name: "r/learnprogramming", type: "subreddit", url: "https://reddit.com/r/learnprogramming", rss_url: "https://www.reddit.com/r/learnprogramming/.rss" },
      { name: "r/cscareerquestions", type: "subreddit", url: "https://reddit.com/r/cscareerquestions", rss_url: "https://www.reddit.com/r/cscareerquestions/.rss" },
      { name: "r/forhire", type: "subreddit", url: "https://reddit.com/r/forhire", rss_url: "https://www.reddit.com/r/forhire/.rss" },
      { name: "r/SomebodyMakeThis", type: "subreddit", url: "https://reddit.com/r/SomebodyMakeThis", rss_url: "https://www.reddit.com/r/SomebodyMakeThis/.rss" },
      { name: "r/deals", type: "subreddit", url: "https://reddit.com/r/deals", rss_url: "https://www.reddit.com/r/deals/.rss" },
    ],
  },
  {
    label: "Newsletters & Blogs",
    emoji: "📰",
    sources: [
      { name: "Benedict Evans", type: "rss", url: "https://www.ben-evans.com", rss_url: "https://www.ben-evans.com/benedictevans/rss.xml" },
      { name: "Stratechery", type: "rss", url: "https://stratechery.com", rss_url: "https://stratechery.com/feed/" },
      { name: "Morning Brew", type: "rss", url: "https://morningbrew.com", rss_url: "https://www.morningbrew.com/daily/stories.rss" },
      { name: "Lenny's Newsletter", type: "rss", url: "https://www.lennysnewsletter.com", rss_url: "https://www.lennysnewsletter.com/feed" },
      { name: "TLDR Newsletter", type: "rss", url: "https://tldr.tech", rss_url: "https://tldr.tech/api/rss/tech" },
    ],
  },
  {
    label: "X / Twitter (via Nitter)",
    emoji: "🐦",
    sources: [
      { name: "Sam Altman (X)", type: "rss", url: "https://x.com/sama", rss_url: "https://nitter.net/sama/rss" },
      { name: "Andrej Karpathy (X)", type: "rss", url: "https://x.com/karpathy", rss_url: "https://nitter.net/karpathy/rss" },
      { name: "Yann LeCun (X)", type: "rss", url: "https://x.com/ylecun", rss_url: "https://nitter.net/ylecun/rss" },
      { name: "Paul Graham (X)", type: "rss", url: "https://x.com/paulg", rss_url: "https://nitter.net/paulg/rss" },
      { name: "Pieter Levels (X)", type: "rss", url: "https://x.com/levelsio", rss_url: "https://nitter.net/levelsio/rss" },
      { name: "DHH (X)", type: "rss", url: "https://x.com/dhh", rss_url: "https://nitter.net/dhh/rss" },
    ],
  },
  {
    label: "Cloud & DevOps",
    emoji: "☁️",
    sources: [
      { name: "AWS News Blog", type: "rss", url: "https://aws.amazon.com/blogs/aws", rss_url: "https://aws.amazon.com/blogs/aws/feed/" },
      { name: "Google Cloud Blog", type: "rss", url: "https://cloud.google.com/blog", rss_url: "https://cloudblog.withgoogle.com/rss/" },
      { name: "Azure Blog", type: "rss", url: "https://azure.microsoft.com/en-us/blog", rss_url: "https://azure.microsoft.com/en-us/blog/feed/" },
      { name: "HashiCorp Blog", type: "rss", url: "https://www.hashicorp.com/blog", rss_url: "https://www.hashicorp.com/blog/feed.xml" },
      { name: "Kubernetes Blog", type: "rss", url: "https://kubernetes.io/blog", rss_url: "https://kubernetes.io/feed.xml" },
    ],
  },
  {
    label: "Security",
    emoji: "🔒",
    sources: [
      { name: "Krebs on Security", type: "rss", url: "https://krebsonsecurity.com", rss_url: "https://krebsonsecurity.com/feed/" },
      { name: "Schneier on Security", type: "rss", url: "https://schneier.com", rss_url: "https://www.schneier.com/feed/atom" },
      { name: "Troy Hunt Blog", type: "rss", url: "https://troyhunt.com", rss_url: "https://feeds.feedburner.com/TroyHunt" },
      { name: "Dark Reading", type: "rss", url: "https://darkreading.com", rss_url: "https://www.darkreading.com/rss.xml" },
      { name: "The Hacker News", type: "rss", url: "https://thehackernews.com", rss_url: "https://feeds.feedburner.com/TheHackersNews" },
    ],
  },
  {
    label: "Hackathons — Worldwide",
    emoji: "🏆",
    sources: [
      { name: "Devpost Blog", type: "rss", url: "https://blog.devpost.com", rss_url: "https://blog.devpost.com/feed" },
      { name: "r/hackathons", type: "subreddit", url: "https://reddit.com/r/hackathons", rss_url: "https://www.reddit.com/r/hackathons/.rss" },
      { name: "Dev.to #hackathon", type: "rss", url: "https://dev.to/t/hackathon", rss_url: "https://dev.to/feed/tag/hackathon" },
      { name: "HackerEarth Blog", type: "rss", url: "https://www.hackerearth.com/blog", rss_url: "https://www.hackerearth.com/blog/feed/" },
      { name: "MLH Blog", type: "rss", url: "https://mlh.io/blog", rss_url: "https://mlh.io/blog/rss" },
      { name: "Devfolio Blog", type: "rss", url: "https://devfolio.co/blog", rss_url: "https://devfolio.co/blog/rss.xml" },
      { name: "r/learnmachinelearning", type: "subreddit", url: "https://reddit.com/r/learnmachinelearning", rss_url: "https://www.reddit.com/r/learnmachinelearning/.rss" },
      { name: "Kaggle Blog", type: "rss", url: "https://medium.com/kaggle-blog", rss_url: "https://medium.com/feed/kaggle-blog" },
      { name: "AngelList Startup Jobs", type: "rss", url: "https://angel.co", rss_url: "https://angel.co/rss" },
      { name: "TechCrunch Startups", type: "rss", url: "https://techcrunch.com/category/startups", rss_url: "https://techcrunch.com/category/startups/feed/" },
    ],
  },
  {
    label: "Philippines — Tech & Startups",
    emoji: "🇵🇭",
    sources: [
      { name: "r/Philippines", type: "subreddit", url: "https://reddit.com/r/Philippines", rss_url: "https://www.reddit.com/r/Philippines/.rss" },
      { name: "r/phtech", type: "subreddit", url: "https://reddit.com/r/phtech", rss_url: "https://www.reddit.com/r/phtech/.rss" },
      { name: "r/PHJobs", type: "subreddit", url: "https://reddit.com/r/PHJobs", rss_url: "https://www.reddit.com/r/PHJobs/.rss" },
      { name: "r/phinvest", type: "subreddit", url: "https://reddit.com/r/phinvest", rss_url: "https://www.reddit.com/r/phinvest/.rss" },
      { name: "Tech In Asia — PH", type: "rss", url: "https://techinasia.com", rss_url: "https://www.techinasia.com/feed" },
      { name: "Rappler Technology", type: "rss", url: "https://rappler.com/technology", rss_url: "https://www.rappler.com/category/technology/feed/" },
      { name: "Inquirer Technology", type: "rss", url: "https://technology.inquirer.net", rss_url: "https://technology.inquirer.net/feed" },
      { name: "Philippine Star Tech", type: "rss", url: "https://philstar.com/technology", rss_url: "https://www.philstar.com/rss/technology" },
      { name: "BusinessWorld Technology", type: "rss", url: "https://businessworldonline.com", rss_url: "https://businessworldonline.com/feed/" },
      { name: "Startup PH (Medium)", type: "rss", url: "https://medium.com/startup-ph", rss_url: "https://medium.com/feed/startup-ph" },
      { name: "QBO Innovation Hub", type: "rss", url: "https://qbo.com.ph/blog", rss_url: "https://qbo.com.ph/blog/feed/" },
      { name: "DICT Philippines", type: "rss", url: "https://dict.gov.ph/news", rss_url: "https://dict.gov.ph/feed/" },
    ],
  },
];

// Flat list for upsert
const ALL_PRESETS = PRESET_GROUPS.flatMap((g) => g.sources);

function SourceCard({ source, onToggle, onDelete, onEdit }: { source: Source; onToggle: (id: string, val: boolean) => void; onDelete: (id: string) => void; onEdit: (source: Source) => void }) {
  const Icon = TYPE_ICONS[source.type as keyof typeof TYPE_ICONS] ?? Globe;
  return (
    <div className={cn("rounded-xl border bg-card p-4 card-hover animate-fade-in-up", !source.is_active && "opacity-50")}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-sm truncate">{source.name}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
              {TYPE_LABELS[source.type as keyof typeof TYPE_LABELS] ?? source.type}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate mb-2">{source.url}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground/70">
            {source.last_fetched_at ? (
              <span>Fetched {formatDistanceToNow(new Date(source.last_fetched_at), { addSuffix: true })}</span>
            ) : (
              <span>Never fetched</span>
            )}
            {source.last_fetch_count > 0 && (
              <span>{source.last_pass_count}/{source.last_fetch_count} passed</span>
            )}
          </div>
          {source.category_tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {source.category_tags.map((t) => (
                <span key={t} className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{t}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Switch checked={source.is_active} onCheckedChange={(val) => onToggle(source.id, val)} className="scale-75" />
          <button onClick={() => onEdit(source)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onDelete(source.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

const EMPTY_FORM = { name: "", type: "rss", url: "", rss_url: "", category_tags: [] as string[], is_active: true };

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [addingPresets, setAddingPresets] = useState(false);
  const [selectedPresets, setSelectedPresets] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["Tech News"]));
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSources = async () => {
    if (!user) return;
    const { data } = await supabase.from("sources").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setSources(data as Source[]);
    setLoading(false);
  };

  useEffect(() => { fetchSources(); }, [user]);

  const openAdd = () => { setEditingSource(null); setForm(EMPTY_FORM); setTagInput(""); setDialogOpen(true); };
  const openEdit = (s: Source) => { setEditingSource(s); setForm({ name: s.name, type: s.type, url: s.url, rss_url: s.rss_url, category_tags: s.category_tags, is_active: s.is_active }); setTagInput(""); setDialogOpen(true); };

  const handleSave = async () => {
    if (!user || !form.name || !form.url) return;
    setSaving(true);
    const payload = { ...form, user_id: user.id, rss_url: form.rss_url || form.url };
    let error;
    if (editingSource) {
      ({ error } = await supabase.from("sources").update(payload).eq("id", editingSource.id));
    } else {
      ({ error } = await supabase.from("sources").insert(payload));
    }
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: editingSource ? "Source updated" : "Source added" }); setDialogOpen(false); fetchSources(); }
    setSaving(false);
  };

  const handleToggle = async (id: string, val: boolean) => {
    setSources((prev) => prev.map((s) => s.id === id ? { ...s, is_active: val } : s));
    await supabase.from("sources").update({ is_active: val }).eq("id", id);
  };

  const handleDelete = async (id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
    await supabase.from("sources").delete().eq("id", id);
    toast({ title: "Source deleted" });
  };

  const togglePreset = (name: string) => {
    setSelectedPresets((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const toggleGroupExpand = (label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  const selectAllInGroup = (group: typeof PRESET_GROUPS[0]) => {
    const allSelected = group.sources.every((s) => selectedPresets.has(s.name));
    setSelectedPresets((prev) => {
      const next = new Set(prev);
      group.sources.forEach((s) => allSelected ? next.delete(s.name) : next.add(s.name));
      return next;
    });
  };

  const addSelectedPresets = async () => {
    if (!user || selectedPresets.size === 0) return;
    setAddingPresets(true);
    const toAdd = ALL_PRESETS.filter((s) => selectedPresets.has(s.name));
    const { error } = await supabase.from("sources").upsert(
      toAdd.map((s) => ({ ...s, user_id: user.id })),
      { onConflict: "user_id,name" }
    );
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: `${selectedPresets.size} source${selectedPresets.size > 1 ? "s" : ""} added!` });
      setPresetsOpen(false);
      setSelectedPresets(new Set());
      fetchSources();
    }
    setAddingPresets(false);
  };

  const addTag = (t: string) => {
    const trimmed = t.trim();
    if (trimmed && !form.category_tags.includes(trimmed)) setForm((f) => ({ ...f, category_tags: [...f.category_tags, trimmed] }));
    setTagInput("");
  };

  const updateUrl = (url: string) => {
    let rss_url = url;
    if (form.type === "subreddit" && url.includes("reddit.com/r/")) {
      const sub = url.split("/r/")[1]?.split("/")[0];
      if (sub) rss_url = `https://www.reddit.com/r/${sub}/.rss`;
    }
    setForm((f) => ({ ...f, url, rss_url }));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6 animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold">Sources</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{sources.length} sources configured</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPresetsOpen(true)} className="gap-1.5">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Browse presets</span>
          </Button>
          <Button size="sm" onClick={openAdd} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add source
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl border border-border bg-card animate-pulse-subtle" />
          ))}
        </div>
      ) : sources.length === 0 ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="text-5xl mb-4 animate-float">📡</div>
          <h3 className="font-display font-semibold text-lg mb-2">No sources yet</h3>
          <p className="text-sm text-muted-foreground mb-6">Add RSS feeds, subreddits, or websites to start collecting articles.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setPresetsOpen(true)}><Sparkles className="h-4 w-4 mr-1.5" /> Browse presets</Button>
            <Button variant="outline" onClick={openAdd}>Add custom</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {sources.map((s, i) => (
            <div key={s.id} style={{ animationDelay: `${i * 40}ms` }}>
              <SourceCard source={s} onToggle={handleToggle} onDelete={handleDelete} onEdit={openEdit} />
            </div>
          ))}
        </div>
      )}

      {/* Preset Picker Dialog */}
      <Dialog open={presetsOpen} onOpenChange={setPresetsOpen}>
        <DialogContent className="max-w-lg bg-card border-border max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display">Browse preset sources</DialogTitle>
            <p className="text-sm text-muted-foreground">{selectedPresets.size} selected</p>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 space-y-2 pr-1 -mr-1">
            {PRESET_GROUPS.map((group) => {
              const isExpanded = expandedGroups.has(group.label);
              const allSelected = group.sources.every((s) => selectedPresets.has(s.name));
              const someSelected = group.sources.some((s) => selectedPresets.has(s.name));
              return (
                <div key={group.label} className="rounded-xl border border-border overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/40 cursor-pointer select-none" onClick={() => toggleGroupExpand(group.label)}>
                    <span className="text-base">{group.emoji}</span>
                    <span className="font-medium text-sm flex-1">{group.label}</span>
                    <button
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full border transition-all",
                        allSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : someSelected
                          ? "bg-primary/20 text-primary border-primary/30"
                          : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
                      )}
                      onClick={(e) => { e.stopPropagation(); selectAllInGroup(group); }}
                    >
                      {allSelected ? "Deselect all" : "Select all"}
                    </button>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  {isExpanded && (
                    <div className="divide-y divide-border/50">
                      {group.sources.map((s) => {
                        const selected = selectedPresets.has(s.name);
                        return (
                          <button
                            key={s.name}
                            onClick={() => togglePreset(s.name)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                              selected ? "bg-primary/5" : "hover:bg-muted/40"
                            )}
                          >
                            <div className={cn(
                              "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all",
                              selected ? "bg-primary border-primary" : "border-border"
                            )}>
                              {selected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{s.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{s.url}</p>
                            </div>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex-shrink-0">
                              {s.type === "subreddit" ? "Reddit" : "RSS"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <DialogFooter className="pt-3 border-t border-border">
            <Button variant="ghost" onClick={() => setPresetsOpen(false)}>Cancel</Button>
            <Button onClick={addSelectedPresets} disabled={selectedPresets.size === 0 || addingPresets} className="gap-1.5">
              {addingPresets ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add {selectedPresets.size > 0 ? selectedPresets.size : ""} source{selectedPresets.size !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">{editingSource ? "Edit source" : "Add source"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="rss">RSS Feed</SelectItem>
                  <SelectItem value="subreddit">Subreddit</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input placeholder="e.g. Hacker News" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="bg-muted border-border" />
            </div>
            <div className="space-y-1.5">
              <Label>URL</Label>
              <Input placeholder="https://..." value={form.url} onChange={(e) => updateUrl(e.target.value)} className="bg-muted border-border" />
            </div>
            {form.rss_url !== form.url && (
              <div className="space-y-1.5">
                <Label>RSS URL (auto-generated)</Label>
                <Input value={form.rss_url} onChange={(e) => setForm((f) => ({ ...f, rss_url: e.target.value }))} className="bg-muted border-border text-xs font-mono" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Category tags (optional)</Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.category_tags.map((t) => (
                  <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
                    {t}
                    <button onClick={() => setForm((f) => ({ ...f, category_tags: f.category_tags.filter((x) => x !== t) }))}>
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag…"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); } }}
                  className="bg-muted border-border text-sm"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => addTag(tagInput)} disabled={!tagInput.trim()}>Add</Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.url}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingSource ? "Save changes" : "Add source"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
