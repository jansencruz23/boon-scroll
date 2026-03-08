import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Plus, Trash2, Edit2, Loader2, Radio, Globe, Hash, RefreshCw, X } from "lucide-react";
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

const PRESET_SOURCES = [
  { name: "freeCodeCamp", type: "rss", url: "https://www.freecodecamp.org/news/rss/", rss_url: "https://www.freecodecamp.org/news/rss/" },
  { name: "Dev.to", type: "rss", url: "https://dev.to/feed", rss_url: "https://dev.to/feed" },
  { name: "Hacker News", type: "rss", url: "https://news.ycombinator.com/rss", rss_url: "https://news.ycombinator.com/rss" },
  { name: "TechCrunch", type: "rss", url: "https://techcrunch.com/feed/", rss_url: "https://techcrunch.com/feed/" },
  { name: "r/artificial", type: "subreddit", url: "https://www.reddit.com/r/artificial/.rss", rss_url: "https://www.reddit.com/r/artificial/.rss" },
  { name: "r/LocalLLaMA", type: "subreddit", url: "https://www.reddit.com/r/LocalLLaMA/.rss", rss_url: "https://www.reddit.com/r/LocalLLaMA/.rss" },
  { name: "r/MachineLearning", type: "subreddit", url: "https://www.reddit.com/r/MachineLearning/.rss", rss_url: "https://www.reddit.com/r/MachineLearning/.rss" },
];

function SourceCard({ source, onToggle, onDelete, onEdit }: { source: Source; onToggle: (id: string, val: boolean) => void; onDelete: (id: string) => void; onEdit: (source: Source) => void }) {
  const Icon = TYPE_ICONS[source.type as keyof typeof TYPE_ICONS] ?? Globe;
  return (
    <div className={cn("rounded-xl border bg-card p-4 card-hover animate-fade-in-up", !source.is_active && "opacity-60")}>
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
          <Switch
            checked={source.is_active}
            onCheckedChange={(val) => onToggle(source.id, val)}
            className="scale-75"
          />
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
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [addingPresets, setAddingPresets] = useState(false);
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

  const addPresets = async () => {
    if (!user) return;
    setAddingPresets(true);
    const { error } = await supabase.from("sources").upsert(
      PRESET_SOURCES.map((s) => ({ ...s, user_id: user.id })),
      { onConflict: "user_id,name" }
    );
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Preset sources added!" }); fetchSources(); }
    setAddingPresets(false);
  };

  const addTag = (t: string) => {
    const trimmed = t.trim();
    if (trimmed && !form.category_tags.includes(trimmed)) {
      setForm((f) => ({ ...f, category_tags: [...f.category_tags, trimmed] }));
    }
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
          <Button variant="outline" size="sm" onClick={addPresets} disabled={addingPresets} className="gap-1.5">
            {addingPresets ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="hidden sm:inline">Add presets</span>
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
            <Button onClick={addPresets} disabled={addingPresets}>⚡ Add popular tech sources</Button>
            <Button variant="outline" onClick={openAdd}>Add custom</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {sources.map((s, i) => (
            <div key={s.id} style={{ animationDelay: `${i * 50}ms` }}>
              <SourceCard source={s} onToggle={handleToggle} onDelete={handleDelete} onEdit={openEdit} />
            </div>
          ))}
        </div>
      )}

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
