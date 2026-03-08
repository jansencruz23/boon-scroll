import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";

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

function StatusPip({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: "bg-cat-promo",
    running: "bg-cat-tech animate-pulse",
    failed: "bg-cat-bad",
  };
  return (
    <span className={cn("inline-block w-1.5 h-1.5 rounded-full flex-shrink-0", map[status] ?? "bg-muted-foreground")} />
  );
}

function RunRow({ run }: { run: DigestRun }) {
  const [expanded, setExpanded] = useState(false);
  const duration = run.completed_at
    ? Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)
    : null;
  const errorLog = Array.isArray(run.error_log) ? run.error_log : [];

  return (
    <div className="border-b border-border last:border-0 animate-fade-in-up">
      <div className="flex items-center gap-3 py-3.5">
        <StatusPip status={run.status} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium tracking-tight">
            {format(new Date(run.started_at), "MMM d, yyyy")}
            <span className="text-muted-foreground font-normal ml-1.5 text-xs">
              {format(new Date(run.started_at), "HH:mm")}
            </span>
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {run.trigger}
            {duration !== null && ` · ${duration}s`}
            {run.email_sent && " · emailed"}
          </p>
        </div>
        <div className="flex items-center gap-4 text-right flex-shrink-0">
          <div>
            <p className="text-xs font-semibold">{run.total_fetched}</p>
            <p className="text-[10px] text-muted-foreground">fetched</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-cat-promo">{run.total_passed}</p>
            <p className="text-[10px] text-muted-foreground">passed</p>
          </div>
          {run.total_errors > 0 && (
            <div>
              <p className="text-xs font-semibold text-cat-bad">{run.total_errors}</p>
              <p className="text-[10px] text-muted-foreground">errors</p>
            </div>
          )}
        </div>
        {errorLog.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
      {expanded && errorLog.length > 0 && (
        <div className="pb-3 animate-fade-in">
          <div className="rounded-md bg-muted/50 border border-border p-3 space-y-1.5">
            {(errorLog as Array<{ source?: string; error?: string; message?: string }>).map((entry, i) => (
              <div key={i} className="text-[11px] font-mono">
                {entry.source && <span className="text-cat-tech">[{entry.source}] </span>}
                <span className="text-cat-bad/80">{entry.error ?? entry.message ?? JSON.stringify(entry)}</span>
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
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-6 animate-fade-in-up">
        <h1 className="text-xl font-semibold tracking-tight">Run History</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Past digest runs and their results</p>
      </div>

      {loading ? (
        <div className="space-y-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="py-3.5 border-b border-border flex items-center gap-3 animate-pulse-subtle">
              <div className="w-1.5 h-1.5 rounded-full bg-muted flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-muted rounded w-32" />
                <div className="h-3 bg-muted rounded w-20" />
              </div>
              <div className="flex gap-4">
                <div className="h-6 w-8 bg-muted rounded" />
                <div className="h-6 w-8 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : runs.length === 0 ? (
        <div className="text-center py-24 animate-fade-in">
          <p className="text-3xl mb-4 animate-float">∅</p>
          <h3 className="text-sm font-semibold mb-1.5 tracking-tight">No runs yet</h3>
          <p className="text-xs text-muted-foreground">Click "Run digest" in the sidebar to start.</p>
        </div>
      ) : (
        <div>
          {runs.map((run, i) => (
            <div key={run.id} style={{ animationDelay: `${i * 30}ms` }}>
              <RunRow run={run} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
