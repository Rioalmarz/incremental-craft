import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import PageTransition from "@/components/PageTransition";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Screening from "./pages/Screening";
import VirtualClinic from "./pages/VirtualClinic";
import Statistics from "./pages/Statistics";
import Excluded from "./pages/Excluded";
import Completed from "./pages/Completed";
import AllPatients from "./pages/AllPatients";
import PreventiveCare from "./pages/PreventiveCare";
import AdminUsers from "./pages/AdminUsers";
import AdminSettings from "./pages/AdminSettings";
import Profile from "./pages/Profile";
import DoctorScheduling from "./pages/DoctorScheduling";
import Eligible from "./pages/Eligible";
import NotFound from "./pages/NotFound";
import AnalyzeExcel from "./pages/AnalyzeExcel";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider>
              <Toaster />
              <Sonner />
              <PageTransition>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/screening" element={<Screening />} />
                  <Route path="/virtual-clinic" element={<VirtualClinic />} />
                  <Route path="/statistics" element={<Statistics />} />
                  <Route path="/excluded" element={<Excluded />} />
                  <Route path="/completed" element={<Completed />} />
                  <Route path="/all-patients" element={<AllPatients />} />
                  <Route path="/preventive-care" element={<PreventiveCare />} />
                  <Route path="/doctor-scheduling" element={<DoctorScheduling />} />
                  <Route path="/eligible" element={<Eligible />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="*" element={<NotFound />} />
                  <Route path="/analyze-excel" element={<AnalyzeExcel />} />
                </Routes>
              </PageTransition>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
