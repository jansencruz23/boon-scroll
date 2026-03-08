import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-10 w-10 rounded-full bg-primary/20 animate-pulse-subtle flex items-center justify-center">
            <span className="text-xl">📜</span>
          </div>
          <Skeleton className="h-2 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
