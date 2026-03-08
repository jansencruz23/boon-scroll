import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TIMEZONES = [
  "Asia/Singapore", "Asia/Tokyo", "Asia/Shanghai", "Asia/Kolkata",
  "Europe/London", "Europe/Paris", "Europe/Berlin",
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "UTC",
];

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("Asia/Singapore");
  const [geminiKey, setGeminiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [digestEnabled, setDigestEnabled] = useState(true);
  const [digestFreq, setDigestFreq] = useState("daily");
  const [digestHour, setDigestHour] = useState(8);
  const [digestEmail, setDigestEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<"idle" | "ok" | "fail">("idle");
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setTimezone(profile.timezone);
      setGeminiKey(profile.gemini_api_key ?? "");
      setDigestEnabled(profile.digest_enabled);
      setDigestFreq(profile.digest_frequency);
      setDigestHour(profile.digest_hour);
      setDigestEmail(profile.digest_email ?? "");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: displayName,
      timezone,
      gemini_api_key: geminiKey,
      digest_enabled: digestEnabled,
      digest_frequency: digestFreq,
      digest_hour: digestHour,
      digest_email: digestEmail,
    }).eq("id", user.id);
    if (error) toast({ title: "Error saving", description: error.message, variant: "destructive" });
    else { toast({ title: "Settings saved ✓" }); await refreshProfile(); }
    setSaving(false);
  };

  const testGeminiKey = async () => {
    if (!geminiKey.trim()) return;
    setTestingKey(true);
    setKeyStatus("idle");
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey.trim()}`,
        { method: "GET" }
      );
      if (res.ok) setKeyStatus("ok");
      else setKeyStatus("fail");
    } catch {
      setKeyStatus("fail");
    }
    setTestingKey(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6 animate-fade-in-up">
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your profile and preferences</p>
      </div>

      <div className="space-y-5">
        {/* Profile */}
        <section className="rounded-xl border border-border bg-card p-6 animate-fade-in-up" style={{ animationDelay: "50ms" }}>
          <h2 className="font-display font-semibold mb-4">Profile</h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Display name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-muted border-border" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user?.email ?? ""} disabled className="bg-muted border-border opacity-60" />
            </div>
            <div className="space-y-1.5">
              <Label>Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Gemini API Key */}
        <section className="rounded-xl border border-border bg-card p-6 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <h2 className="font-display font-semibold mb-1">Gemini API Key</h2>
          <p className="text-sm text-muted-foreground mb-4">Used to classify articles. Get yours free at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline">aistudio.google.com</a>.</p>
          <div className="space-y-3">
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                placeholder="AIza..."
                value={geminiKey}
                onChange={(e) => { setGeminiKey(e.target.value); setKeyStatus("idle"); }}
                className="bg-muted border-border font-mono text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={testGeminiKey} disabled={testingKey || !geminiKey.trim()} className="gap-2">
                {testingKey ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Test key
              </Button>
              {keyStatus === "ok" && (
                <span className="flex items-center gap-1.5 text-sm text-green-400 animate-fade-in">
                  <CheckCircle className="h-4 w-4" /> Key is valid
                </span>
              )}
              {keyStatus === "fail" && (
                <span className="flex items-center gap-1.5 text-sm text-destructive animate-fade-in">
                  <AlertCircle className="h-4 w-4" /> Invalid key
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Digest preferences */}
        <section className="rounded-xl border border-border bg-card p-6 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
          <h2 className="font-display font-semibold mb-4">Email Digest</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable digest</Label>
                <p className="text-xs text-muted-foreground">Receive article summaries by email</p>
              </div>
              <Switch checked={digestEnabled} onCheckedChange={setDigestEnabled} />
            </div>
            {digestEnabled && (
              <>
                <div className="space-y-1.5">
                  <Label>Digest email</Label>
                  <Input type="email" value={digestEmail} onChange={(e) => setDigestEmail(e.target.value)} className="bg-muted border-border" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Frequency</Label>
                    <Select value={digestFreq} onValueChange={setDigestFreq}>
                      <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="realtime">Real-time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Hour (0–23)</Label>
                    <Input type="number" min={0} max={23} value={digestHour} onChange={(e) => setDigestHour(Number(e.target.value))} className="bg-muted border-border" />
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        <Button onClick={handleSave} disabled={saving} className="w-full font-semibold gap-2 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save all settings
        </Button>
      </div>
    </div>
  );
}
