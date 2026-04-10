import JobManager from "./pages/JobManager";
import CustomerUpdate from "./pages/CustomerUpdate";
import CustomerTracking from "./pages/CustomerTracking";
import SystemWorkflow from "./pages/SystemWorkflow";
import CustomerProposal from "./pages/CustomerProposal";
import CustomerShowroom from "./pages/CustomerShowroom";
import MaterialRequest from "./pages/MaterialRequest";
import MaterialCatalog from "./pages/MaterialCatalog";
import PricingSettings from "./pages/PricingSettings";
import QuotationBuilder from "./pages/QuotationBuilder";
import PortalDashboard from "./pages/PortalDashboard";
import CustomerDatabase from "./pages/CustomerDatabase";
import InstallerDatabase from "./pages/InstallerDatabase";
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
            <Route path="/portal" element={<PortalDashboard />} />
            <Route path="/workflow" element={<SystemWorkflow />} />
            <Route path="/job-manager" element={<JobManager />} />
            <Route path="/customer-update" element={<CustomerUpdate />} />
            <Route path="/customer-tracking" element={<CustomerTracking />} />
            <Route path="/pricing" element={<PricingSettings />} />
            <Route path="/quotation-builder" element={<QuotationBuilder />} />
            <Route path="/materials" element={<MaterialCatalog />} />
            <Route path="/material-request" element={<MaterialRequest />} />
            <Route path="/showroom" element={<CustomerShowroom />} />
            <Route path="/proposal" element={<CustomerProposal />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/job-card" element={<JobCard />} />
            <Route path="/installers" element={<InstallerDatabase />} />      
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
            <Route path="/customers" element={<CustomerDatabase />} />
            
            {/* หน้าลูกค้า (Customer) */}
            <Route path="/customer-check" element={<CustomerCheck />} />
            
            {/* หน้า 404 ต้องอยู่ล่างสุดเสมอ */}
           <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;