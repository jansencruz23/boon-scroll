import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  display_name: string;
  description: string;
  emoji: string;
  color: string;
  priority: number;
  is_active: boolean;
}

interface Profile {
  confidence_threshold: number;
  strictness: string;
  interest_keywords: string | null;
}

const EMPTY_CAT = { name: "", display_name: "", description: "", emoji: "📌", color: "#6366f1", priority: 3, is_active: true };

function CategoryCard({ cat, onToggle, onDelete, onEdit }: { cat: Category; onToggle: (id: string, val: boolean) => void; onDelete: (id: string) => void; onEdit: (cat: Category) => void }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border bg-card px-4 py-3 card-hover animate-fade-in", !cat.is_active && "opacity-50")}>
      <span className="text-xl flex-shrink-0">{cat.emoji}</span>
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: cat.color }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{cat.display_name}</span>
          <span className="text-xs text-muted-foreground font-mono">{cat.name}</span>
          <span className="text-xs text-muted-foreground ml-auto">P{cat.priority}</span>
        </div>
        {cat.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{cat.description}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Switch checked={cat.is_active} onCheckedChange={(v) => onToggle(cat.id, v)} className="scale-75" />
        <button onClick={() => onEdit(cat)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onDelete(cat.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function FiltersPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [form, setForm] = useState(EMPTY_CAT);
  const [saving, setSaving] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [keywords, setKeywords] = useState("");
  const [confidence, setConfidence] = useState(0.5);
  const [strictness, setStrictness] = useState("strict");
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("categories").select("*").eq("user_id", user.id).order("priority"),
      supabase.from("profiles").select("confidence_threshold, strictness, interest_keywords").eq("id", user.id).single(),
    ]).then(([catsRes, profRes]) => {
      if (catsRes.data) setCategories(catsRes.data as Category[]);
      if (profRes.data) {
        setProfile(profRes.data as Profile);
        setKeywords(profRes.data.interest_keywords ?? "");
        setConfidence(profRes.data.confidence_threshold);
        setStrictness(profRes.data.strictness);
      }
      setLoading(false);
    });
  }, [user]);

  const savePrefs = async () => {
    if (!user) return;
    setSavingPrefs(true);
    const { error } = await supabase.from("profiles").update({
      confidence_threshold: confidence,
      strictness,
      interest_keywords: keywords,
    }).eq("id", user.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Preferences saved" });
    setSavingPrefs(false);
  };

  const openAdd = () => { setEditingCat(null); setForm(EMPTY_CAT); setDialogOpen(true); };
  const openEdit = (c: Category) => { setEditingCat(c); setForm({ name: c.name, display_name: c.display_name, description: c.description, emoji: c.emoji, color: c.color, priority: c.priority, is_active: c.is_active }); setDialogOpen(true); };

  const handleSaveCat = async () => {
    if (!user) return;
    setSaving(true);
    let error;
    if (editingCat) {
      ({ error } = await supabase.from("categories").update(form).eq("id", editingCat.id));
    } else {
      ({ error } = await supabase.from("categories").insert({ ...form, user_id: user.id }));
    }
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: editingCat ? "Category updated" : "Category added" });
      setDialogOpen(false);
      const { data } = await supabase.from("categories").select("*").eq("user_id", user.id).order("priority");
      if (data) setCategories(data as Category[]);
    }
    setSaving(false);
  };

  const handleToggle = async (id: string, val: boolean) => {
    setCategories((prev) => prev.map((c) => c.id === id ? { ...c, is_active: val } : c));
    await supabase.from("categories").update({ is_active: val }).eq("id", id);
  };

  const handleDelete = async (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    await supabase.from("categories").delete().eq("id", id);
    toast({ title: "Category deleted" });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6 animate-fade-in-up">
        <h1 className="font-display text-2xl font-bold">Filters & Preferences</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure how the AI classifies and filters articles</p>
      </div>

      {/* Preferences card */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6 animate-fade-in-up" style={{ animationDelay: "50ms" }}>
        <h2 className="font-display font-semibold mb-4">AI Preferences</h2>
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Confidence threshold</Label>
              <span className="text-sm font-mono text-primary">{(confidence * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[confidence]}
              onValueChange={([v]) => setConfidence(v)}
              min={0} max={1} step={0.05}
              className="py-1"
            />
            <p className="text-xs text-muted-foreground">Articles below this confidence won't appear in relevant feed.</p>
          </div>

          <div className="space-y-2">
            <Label>Strictness</Label>
            <div className="flex gap-2">
              {["relaxed", "strict"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStrictness(s)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium border transition-all duration-200 capitalize",
                    strictness === s
                      ? "bg-primary/10 border-primary/40 text-primary"
                      : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                  )}
                >
                  {s === "relaxed" ? "🌊 Relaxed" : "🎯 Strict"}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Strict mode filters borderline articles more aggressively.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">Interest keywords</Label>
            <Input
              id="keywords"
              placeholder="Python, Docker, AI, React, ..."
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="bg-muted border-border"
            />
            <p className="text-xs text-muted-foreground">Comma-separated. These guide the AI when prioritizing articles.</p>
          </div>

          <Button onClick={savePrefs} disabled={savingPrefs} className="gap-2">
            {savingPrefs ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save preferences
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold">Categories</h2>
          <Button size="sm" onClick={openAdd} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add category
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl border border-border bg-card animate-pulse-subtle" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map((c, i) => (
              <div key={c.id} style={{ animationDelay: `${i * 50}ms` }}>
                <CategoryCard cat={c} onToggle={handleToggle} onDelete={handleDelete} onEdit={openEdit} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">{editingCat ? "Edit category" : "Add category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Emoji</Label>
                <Input value={form.emoji} onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))} className="bg-muted border-border text-center text-xl" maxLength={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent" />
                  <Input value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} className="bg-muted border-border font-mono text-xs" />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Internal name (no spaces)</Label>
              <Input placeholder="TECH_UPDATE" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.toUpperCase().replace(/\s/g, "_") }))} className="bg-muted border-border font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label>Display name</Label>
              <Input placeholder="Tech Updates" value={form.display_name} onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))} className="bg-muted border-border" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input placeholder="What kind of articles belong here?" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="bg-muted border-border" />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between"><Label>Priority (1=highest)</Label><span className="text-sm font-mono text-primary">{form.priority}</span></div>
              <Slider value={[form.priority]} onValueChange={([v]) => setForm((f) => ({ ...f, priority: v }))} min={1} max={5} step={1} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveCat} disabled={saving || !form.name || !form.display_name}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingCat ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
