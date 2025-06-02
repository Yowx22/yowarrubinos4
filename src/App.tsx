import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { AudioPlayer } from "./components/AudioPlayer/AudioPlayer";
import Mines from "./components/Games/Mines";
import BugReport from "./components/BugReport/BugReport";
import { LanguageSwitcher } from "./components/LanguageSwitcher/LanguageSwitcher";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/free-key" element={<Index />} />
            <Route path="/spin" element={<Index activeTab="spin" />} />
            <Route path="/shop" element={<Index activeTab="shop" />} />
            <Route path="/afk-farm" element={<Index activeTab="afk" />} />
            <Route path="/leaderboard" element={<Index activeTab="afk" />} />
            <Route path="/games/mines" element={<Index activeTab="games" />} />
            <Route path="/bug-report" element={<BugReport />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AudioPlayer />
          <LanguageSwitcher />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;