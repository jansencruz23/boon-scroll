import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const { user, profile, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (profile && !profile.onboarding_completed) return <Navigate to="/onboarding" replace />;
  return <Navigate to="/feed" replace />;
}
