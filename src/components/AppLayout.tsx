import { useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Rss, SlidersHorizontal, Bookmark, BarChart2, Settings,
  Zap, LogOut, Menu, X, Loader2, LayoutDashboard
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const NAV_ITEMS = [
  { href: "/feed", icon: LayoutDashboard, label: "Feed" },
  { href: "/sources", icon: Rss, label: "Sources" },
  { href: "/filters", icon: SlidersHorizontal, label: "Filters" },
  { href: "/saved", icon: Bookmark, label: "Saved" },
  { href: "/runs", icon: BarChart2, label: "Runs" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const handleRunNow = async () => {
    if (!profile?.gemini_api_key) {
      toast({ title: "No API key set", description: "Add your Gemini API key in Settings.", variant: "destructive" });
      navigate("/settings");
      return;
    }
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("digest-run", {
        body: { user_id: user?.id },
      });
      if (error) throw error;
      toast({ title: "Digest complete", description: `${data?.total_fetched ?? 0} fetched · ${data?.total_passed ?? 0} passed` });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Run failed", description: message, variant: "destructive" });
    }
    setRunning(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const NavContent = ({ onNav }: { onNav?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Wordmark */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-sm bg-foreground flex items-center justify-center flex-shrink-0">
            <span className="text-background text-[10px] font-bold leading-none">B</span>
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">Boon Scroll</span>
        </div>
      </div>

      {/* Run button */}
      <div className="px-3 pb-3">
        <button
          onClick={handleRunNow}
          disabled={running}
          className={cn(
            "w-full flex items-center justify-center gap-2 h-8 rounded-md text-xs font-medium transition-all duration-150",
            "bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
          )}
        >
          {running
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Zap className="h-3.5 w-3.5" />
          }
          {running ? "Running…" : "Run digest"}
        </button>
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-sidebar-border mb-2" />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5 scrollbar-thin">
        {NAV_ITEMS.map(({ href, icon: Icon, label }, i) => {
          const active = location.pathname === href;
          return (
            <Link
              key={href}
              to={href}
              onClick={onNav}
              className={cn(
                "relative flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-150",
                "opacity-0 animate-slide-in-left",
                `animate-stagger-${Math.min(i + 1, 5)}`,
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/70"
              )}
              style={{ animationFillMode: "forwards" }}
            >
              <Icon className="h-3.5 w-3.5 flex-shrink-0" />
              {label}
              {active && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-foreground opacity-60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <div className="px-3 py-2">
          <p className="text-xs font-medium text-sidebar-accent-foreground truncate leading-snug">
            {profile?.display_name ?? "—"}
          </p>
          <p className="text-[11px] text-sidebar-foreground/50 truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-xs text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/70 transition-all duration-150"
        >
          <LogOut className="h-3 w-3 flex-shrink-0" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-52 flex-shrink-0 bg-sidebar border-r border-sidebar-border">
        <NavContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-52 bg-sidebar border-r border-sidebar-border flex flex-col animate-slide-in-left z-10 shadow-elevated">
            <NavContent onNav={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 h-11 border-b border-border bg-card flex-shrink-0">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <span className="text-sm font-semibold tracking-tight">Boon Scroll</span>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
