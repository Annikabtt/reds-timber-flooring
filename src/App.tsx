import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import LandingPage from "./pages/LandingPage";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import Tasks from "./pages/Tasks";
import Projects from "./pages/Projects";
import Contacts from "./pages/Contacts";
import Team from "./pages/Team";
import PhotoApproval from "./pages/PhotoApproval";
import Payroll from "./pages/Payroll";
import ProjectTimeline from "./pages/ProjectTimeline";
import SettingsPage from "./pages/SettingsPage";
import TechHome from "./pages/technician/TechHome";
import TechMaterials from "./pages/technician/TechMaterials";
import TechReport from "./pages/technician/TechReport";
import TechLeave from "./pages/technician/TechLeave";
import JobCard from "./pages/JobCard";
import CustomerCheck from "./pages/CustomerCheck";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/job-card" element={<JobCard />} />
            <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
            <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
            <Route path="/photos" element={<ProtectedRoute><PhotoApproval /></ProtectedRoute>} />
            <Route path="/payroll" element={<ProtectedRoute><Payroll /></ProtectedRoute>} />
            <Route path="/project-timeline" element={<ProtectedRoute><ProjectTimeline /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/tech" element={<ProtectedRoute><TechHome /></ProtectedRoute>} />
            <Route path="/tech/materials" element={<ProtectedRoute><TechMaterials /></ProtectedRoute>} />
            <Route path="/tech/report" element={<ProtectedRoute><TechReport /></ProtectedRoute>} />
            <Route path="/tech/leave" element={<ProtectedRoute><TechLeave /></ProtectedRoute>} />
            <Route path="/tech/report" element={<ProtectedRoute><TechReport /></ProtectedRoute>} />
            <Route path="/tech/leave" element={<ProtectedRoute><TechLeave /></ProtectedRoute>} />
            
            {/* หน้าลูกค้า (Customer) */}
            <Route path="/customer-check" element={<CustomerCheck />} />
            
            {/* หน้า 404 ต้องอยู่ล่างสุดเสมอ */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;