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

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="border border-border rounded-md overflow-hidden animate-fade-in-up">
      <div className="px-5 py-4 border-b border-border bg-muted/30">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="px-5 py-5 space-y-4">{children}</div>
    </section>
  );
}

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
    else { toast({ title: "Saved" }); await refreshProfile(); }
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
      setKeyStatus(res.ok ? "ok" : "fail");
    } catch {
      setKeyStatus("fail");
    }
    setTestingKey(false);
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <div className="mb-6 animate-fade-in-up">
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manage your profile and preferences</p>
      </div>

      <div className="space-y-3">
        <Section title="Profile">
          <div className="space-y-1.5">
            <Label className="text-xs">Display name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-8 text-sm bg-muted border-border" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Email</Label>
            <Input value={user?.email ?? ""} disabled className="h-8 text-sm bg-muted border-border opacity-50" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="h-8 text-sm bg-muted border-border"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {TIMEZONES.map((tz) => <SelectItem key={tz} value={tz} className="text-sm">{tz}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </Section>

        <Section
          title="Gemini API Key"
          description="Used to classify articles. Free at aistudio.google.com."
        >
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              placeholder="AIza…"
              value={geminiKey}
              onChange={(e) => { setGeminiKey(e.target.value); setKeyStatus("idle"); }}
              className="h-8 text-sm bg-muted border-border font-mono pr-10"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={testGeminiKey}
              disabled={testingKey || !geminiKey.trim()}
              className="h-7 text-xs gap-1.5"
            >
              {testingKey && <Loader2 className="h-3 w-3 animate-spin" />}
              Test key
            </Button>
            {keyStatus === "ok" && (
              <span className="flex items-center gap-1.5 text-xs text-cat-promo animate-fade-in">
                <CheckCircle className="h-3.5 w-3.5" /> Valid
              </span>
            )}
            {keyStatus === "fail" && (
              <span className="flex items-center gap-1.5 text-xs text-cat-bad animate-fade-in">
                <AlertCircle className="h-3.5 w-3.5" /> Invalid
              </span>
            )}
          </div>
        </Section>

        <Section title="Email Digest">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Enable digest</p>
              <p className="text-xs text-muted-foreground">Receive summaries by email</p>
            </div>
            <Switch checked={digestEnabled} onCheckedChange={setDigestEnabled} />
          </div>
          {digestEnabled && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Digest email</Label>
                <Input type="email" value={digestEmail} onChange={(e) => setDigestEmail(e.target.value)} className="h-8 text-sm bg-muted border-border" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Frequency</Label>
                  <Select value={digestFreq} onValueChange={setDigestFreq}>
                    <SelectTrigger className="h-8 text-sm bg-muted border-border"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="daily" className="text-sm">Daily</SelectItem>
                      <SelectItem value="weekly" className="text-sm">Weekly</SelectItem>
                      <SelectItem value="realtime" className="text-sm">Real-time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Hour (0–23)</Label>
                  <Input type="number" min={0} max={23} value={digestHour} onChange={(e) => setDigestHour(Number(e.target.value))} className="h-8 text-sm bg-muted border-border" />
                </div>
              </div>
            </>
          )}
        </Section>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-8 text-sm gap-2 animate-fade-in-up font-medium"
          style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save settings
        </Button>
      </div>
    </div>
  );
}
