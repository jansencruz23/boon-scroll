import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, X, ExternalLink, CheckCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESET_SOURCES = [
  { name: "freeCodeCamp", type: "rss", url: "https://www.freecodecamp.org/news/rss/", rss_url: "https://www.freecodecamp.org/news/rss/" },
  { name: "Dev.to", type: "rss", url: "https://dev.to/feed", rss_url: "https://dev.to/feed" },
  { name: "Hacker News", type: "rss", url: "https://news.ycombinator.com/rss", rss_url: "https://news.ycombinator.com/rss" },
  { name: "TechCrunch", type: "rss", url: "https://techcrunch.com/feed/", rss_url: "https://techcrunch.com/feed/" },
  { name: "r/artificial", type: "subreddit", url: "https://www.reddit.com/r/artificial/.rss", rss_url: "https://www.reddit.com/r/artificial/.rss" },
  { name: "r/LocalLLaMA", type: "subreddit", url: "https://www.reddit.com/r/LocalLLaMA/.rss", rss_url: "https://www.reddit.com/r/LocalLLaMA/.rss" },
  { name: "r/MachineLearning", type: "subreddit", url: "https://www.reddit.com/r/MachineLearning/.rss", rss_url: "https://www.reddit.com/r/MachineLearning/.rss" },
];

const KEYWORD_SUGGESTIONS = ["Python", "Docker", "React", "TypeScript", "AI", "LLM", "Kubernetes", "Rust", "Go", "Cloud", "DevOps", "Security"];

const STEPS = ["Sources", "Interests", "API Key"];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [sourcesAdded, setSourcesAdded] = useState(false);
  const [addingPresets, setAddingPresets] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const addPresets = async () => {
    if (!user) return;
    setAddingPresets(true);
    const { error } = await supabase
      .from("sources")
      .upsert(
        PRESET_SOURCES.map((s) => ({ ...s, user_id: user.id })),
        { onConflict: "user_id,name" }
      );
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSourcesAdded(true);
      toast({ title: "✅ Sources added!", description: `${PRESET_SOURCES.length} sources ready.` });
    }
    setAddingPresets(false);
  };

  const addKeyword = (word: string) => {
    const trimmed = word.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
    }
    setKeywordInput("");
  };

  const removeKeyword = (word: string) => setKeywords(keywords.filter((k) => k !== word));

  const handleKeywordKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeyword(keywordInput);
    }
  };

  const finishOnboarding = async () => {
    if (!user) return;
    setSaving(true);
    const updates: Record<string, unknown> = {
      onboarding_completed: true,
      interest_keywords: keywords.join(", "),
    };
    if (geminiKey.trim()) updates.gemini_api_key = geminiKey.trim();

    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
    if (error) {
      toast({ title: "Error saving profile", description: error.message, variant: "destructive" });
      setSaving(false);
      return;
    }
    await refreshProfile();
    navigate("/feed");
  };

  const skipOnboarding = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id);
    await refreshProfile();
    navigate("/feed");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <span className="text-3xl">📜</span>
          </div>
          <h1 className="font-display text-2xl font-bold">Set up Boon Scroll</h1>
          <p className="text-muted-foreground text-sm mt-1">Just a few steps to get your feed ready</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-all duration-300",
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                    ? "bg-primary/20 text-primary border border-primary/40"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {i < step ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn("text-xs hidden sm:block", i === step ? "text-foreground font-medium" : "text-muted-foreground")}>
                {label}
              </span>
              {i < STEPS.length - 1 && <div className={cn("w-8 h-px", i < step ? "bg-primary" : "bg-border")} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
          {/* Step 1: Sources */}
          {step === 0 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="font-display text-lg font-semibold mb-1">Add content sources</h2>
                <p className="text-sm text-muted-foreground">Choose where Boon Scroll fetches articles from.</p>
              </div>
              <Button
                onClick={addPresets}
                disabled={addingPresets || sourcesAdded}
                className={cn("w-full font-medium", sourcesAdded && "bg-primary/10 text-primary border border-primary/20")}
                variant={sourcesAdded ? "outline" : "default"}
              >
                {addingPresets ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Adding sources…</>
                ) : sourcesAdded ? (
                  <><CheckCircle className="h-4 w-4 mr-2" /> 7 popular tech sources added!</>
                ) : (
                  "⚡ Add popular tech sources (recommended)"
                )}
              </Button>
              <div className="text-center text-xs text-muted-foreground">
                Includes freeCodeCamp, Dev.to, Hacker News, TechCrunch, r/artificial, r/LocalLLaMA, r/MachineLearning
              </div>
              <Button variant="outline" className="w-full text-sm" onClick={() => navigate("/sources")}>
                <Plus className="h-4 w-4 mr-2" /> Add custom sources instead
              </Button>
            </div>
          )}

          {/* Step 2: Interests */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="font-display text-lg font-semibold mb-1">What interests you?</h2>
                <p className="text-sm text-muted-foreground">Keywords guide the AI when classifying articles. Add as many as you like.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {KEYWORD_SUGGESTIONS.filter((k) => !keywords.includes(k)).map((k) => (
                  <button
                    key={k}
                    onClick={() => addKeyword(k)}
                    className="px-3 py-1 rounded-full text-xs border border-border hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-all duration-200"
                  >
                    + {k}
                  </button>
                ))}
              </div>
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {keywords.map((k) => (
                    <span key={k} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20 font-medium">
                      {k}
                      <button onClick={() => removeKeyword(k)} className="hover:text-primary/60 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="Type a keyword and press Enter"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={handleKeywordKey}
                  className="bg-muted border-border"
                />
                <Button type="button" variant="outline" onClick={() => addKeyword(keywordInput)} disabled={!keywordInput.trim()}>
                  Add
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Gemini API Key */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="font-display text-lg font-semibold mb-1">Connect Gemini AI</h2>
                <p className="text-sm text-muted-foreground">
                  Boon Scroll uses Google Gemini to classify and rank articles. Your key is stored securely and never shared.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/50 p-4 text-sm space-y-2">
                <p className="font-medium text-foreground">How to get your free API key:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Visit Google AI Studio</li>
                  <li>Sign in with your Google account</li>
                  <li>Click "Get API key" → "Create API key"</li>
                  <li>Copy and paste it below</li>
                </ol>
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Open Google AI Studio <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gemini-key">Gemini API Key</Label>
                <Input
                  id="gemini-key"
                  type="password"
                  placeholder="AIza..."
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="bg-muted border-border font-mono text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground">You can also add this later in Settings.</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <Button variant="ghost" onClick={step === 0 ? skipOnboarding : () => setStep(step - 1)} className="text-muted-foreground">
              {step === 0 ? "Skip setup" : "Back"}
            </Button>
            <Button
              onClick={step === STEPS.length - 1 ? finishOnboarding : () => setStep(step + 1)}
              disabled={saving}
              className="font-medium"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : step === STEPS.length - 1 ? (
                "Finish setup"
              ) : (
                <>Next <ChevronRight className="h-4 w-4 ml-1" /></>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
