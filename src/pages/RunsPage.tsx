import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, CheckCircle, XCircle, Loader2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";

interface DigestRun {
  id: string;
  status: string;
  trigger: string;
  total_fetched: number;
  total_passed: number;
  total_errors: number;
  error_log: unknown;
  email_sent: boolean;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-green-500/10 text-green-400 border-green-500/20",
    running: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    failed: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  const icons: Record<string, React.ReactNode> = {
    completed: <CheckCircle className="h-3 w-3" />,
    running: <Loader2 className="h-3 w-3 animate-spin" />,
    failed: <XCircle className="h-3 w-3" />,
  };
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border", styles[status] ?? "bg-muted text-muted-foreground border-border")}>
      {icons[status]}
      {status}
    </span>
  );
}

function RunRow({ run }: { run: DigestRun }) {
  const [expanded, setExpanded] = useState(false);
  const duration = run.completed_at
    ? Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)
    : null;
  const errorLog = Array.isArray(run.error_log) ? run.error_log : [];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden animate-fade-in-up card-hover">
      <div className="flex items-center gap-4 px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <StatusBadge status={run.status} />
            <span className="text-xs text-muted-foreground capitalize">{run.trigger}</span>
            {run.email_sent && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">📧 emailed</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {format(new Date(run.started_at), "MMM d, yyyy · HH:mm")}
            {duration !== null && ` · ${duration}s`}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-right flex-shrink-0">
          <div>
            <div className="font-semibold text-foreground">{run.total_fetched}</div>
            <div className="text-muted-foreground">fetched</div>
          </div>
          <div>
            <div className="font-semibold text-primary">{run.total_passed}</div>
            <div className="text-muted-foreground">passed</div>
          </div>
          {run.total_errors > 0 && (
            <div>
              <div className="font-semibold text-destructive">{run.total_errors}</div>
              <div className="text-muted-foreground">errors</div>
            </div>
          )}
        </div>
        {errorLog.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        )}
      </div>
      {expanded && errorLog.length > 0 && (
        <div className="border-t border-border px-4 py-3 bg-muted/30 animate-fade-in">
          <p className="text-xs font-medium text-muted-foreground mb-2">Error details</p>
          <div className="space-y-1.5">
            {(errorLog as Array<{source?: string; error?: string; message?: string}>).map((entry, i) => (
              <div key={i} className="text-xs rounded-lg bg-muted/50 px-3 py-2 font-mono">
                {entry.source && <span className="text-primary">[{entry.source}] </span>}
                <span className="text-destructive/80">{entry.error ?? entry.message ?? JSON.stringify(entry)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RunsPage() {
  const [runs, setRuns] = useState<DigestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("digest_runs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setRuns(data as DigestRun[]);
        setLoading(false);
      });

    const channel = supabase
      .channel("runs-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "digest_runs", filter: `user_id=eq.${user.id}` },
        () => {
          supabase.from("digest_runs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50).then(({ data }) => {
            if (data) setRuns(data as DigestRun[]);
          });
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6 animate-fade-in-up">
        <h1 className="font-display text-2xl font-bold">Run History</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Past digest runs and their results</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl border border-border bg-card animate-pulse-subtle" />
          ))}
        </div>
      ) : runs.length === 0 ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="text-5xl mb-4 animate-float">📊</div>
          <h3 className="font-display font-semibold text-lg mb-2">No runs yet</h3>
          <p className="text-sm text-muted-foreground">Click "Run Now" in the sidebar to fetch your first digest.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map((run, i) => (
            <div key={run.id} style={{ animationDelay: `${i * 40}ms` }}>
              <RunRow run={run} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
