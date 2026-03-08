import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Home, Radio, SlidersHorizontal, Bookmark, BarChart2, Settings,
  Zap, LogOut, ChevronLeft, ChevronRight, Menu, X, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const NAV_ITEMS = [
  { href: "/feed", icon: Home, label: "Feed" },
  { href: "/sources", icon: Radio, label: "Sources" },
  { href: "/filters", icon: SlidersHorizontal, label: "Filters" },
  { href: "/saved", icon: Bookmark, label: "Saved" },
  { href: "/runs", icon: BarChart2, label: "Run History" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const handleRunNow = async () => {
    if (!profile?.gemini_api_key) {
      toast({ title: "No Gemini API key", description: "Add your Gemini API key in Settings first.", variant: "destructive" });
      navigate("/settings");
      return;
    }
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("digest-run", {
        body: { user_id: user?.id },
      });
      if (error) throw error;
      toast({ title: "✅ Digest run complete!", description: `Fetched ${data?.total_fetched ?? 0} articles, ${data?.total_passed ?? 0} passed filters.` });
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

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn("flex items-center gap-3 px-4 py-5 border-b border-sidebar-border", collapsed && "justify-center px-2")}>
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <span className="text-lg">📜</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="font-display font-bold text-sm text-sidebar-foreground leading-tight">Boon Scroll</h1>
            <p className="text-xs text-sidebar-foreground/40">AI digest</p>
          </div>
        )}
      </div>

      {/* Run Now */}
      <div className={cn("p-3 border-b border-sidebar-border", collapsed && "p-2")}>
        <Button
          onClick={handleRunNow}
          disabled={running}
          className={cn(
            "w-full font-semibold text-sm transition-all duration-200",
            "bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow",
            collapsed && "p-2 aspect-square"
          )}
          size={collapsed ? "icon" : "default"}
        >
          {running ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Zap className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span className="ml-2">Run Now</span>}
            </>
          )}
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin">
        {NAV_ITEMS.map(({ href, icon: Icon, label }, i) => {
          const active = location.pathname === href;
          return (
            <Link
              key={href}
              to={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                "opacity-0 animate-slide-in-left",
                `animate-stagger-${Math.min(i + 1, 5)}`,
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-2"
              )}
              style={{ animationFillMode: "forwards" }}
            >
              <Icon className={cn("h-4 w-4 flex-shrink-0", active && "text-primary")} />
              {!collapsed && label}
              {!collapsed && active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className={cn("p-3 border-t border-sidebar-border", collapsed && "p-2")}>
        {!collapsed && (
          <div className="mb-2 px-3 py-2 rounded-lg bg-sidebar-accent/50">
            <p className="text-xs font-medium text-sidebar-accent-foreground truncate">{profile?.display_name ?? "User"}</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">{user?.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-all duration-200",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-3.5 w-3.5 flex-shrink-0" />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col flex-shrink-0 bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out relative",
          collapsed ? "w-16" : "w-56"
        )}
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors z-10 shadow-card"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-sidebar border-r border-sidebar-border flex flex-col animate-slide-in-left z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <button onClick={() => setMobileOpen(true)} className="text-foreground/70 hover:text-foreground transition-colors">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display font-bold text-sm">📜 Boon Scroll</span>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
