import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import OnboardingPage from "./pages/OnboardingPage";
import FeedPage from "./pages/FeedPage";
import SourcesPage from "./pages/SourcesPage";
import FiltersPage from "./pages/FiltersPage";
import SavedPage from "./pages/SavedPage";
import RunsPage from "./pages/RunsPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Onboarding — protected but no layout */}
            <Route path="/onboarding" element={
              <ProtectedRoute><OnboardingPage /></ProtectedRoute>
            } />

            {/* App — protected with sidebar layout */}
            <Route path="/feed" element={
              <ProtectedRoute>
                <AppLayout><FeedPage /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/sources" element={
              <ProtectedRoute>
                <AppLayout><SourcesPage /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/filters" element={
              <ProtectedRoute>
                <AppLayout><FiltersPage /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/saved" element={
              <ProtectedRoute>
                <AppLayout><SavedPage /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/runs" element={
              <ProtectedRoute>
                <AppLayout><RunsPage /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <AppLayout><SettingsPage /></AppLayout>
              </ProtectedRoute>
            } />

            {/* Root redirect */}
            <Route path="/" element={<Index />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
