import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import TrainingSessions from "./pages/TrainingSessions";
import AthleteComparison from "./pages/AthleteComparison";
import AthleteDetail from "./pages/AthleteDetail";
import AthleteDashboard from "./pages/AthleteDashboard";
import AthleteTests from "./pages/AthleteTests";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <Toaster />
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/app" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/training" element={<TrainingSessions />} />
            <Route path="/comparison" element={<AthleteComparison />} />
            <Route path="/athlete/:athleteId" element={<AthleteDetail />} />
            <Route path="/my-training" element={<AthleteDashboard />} />
            <Route path="/tests" element={<AthleteTests />} />
            <Route path="/tests/:athleteId" element={<AthleteTests />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
