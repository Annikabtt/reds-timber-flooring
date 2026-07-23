import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import PermissionRoute from "@/components/PermissionRoute";

import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import AccountAccessPage from "./pages/AccountAccessPage";
import NotFound from "./pages/NotFound";

import JobManager from "./pages/JobManager";
import CustomerUpdate from "./pages/CustomerUpdate";
import CustomerTracking from "./pages/CustomerTracking";
import SystemWorkflow from "./pages/SystemWorkflow";
import CustomerProposal from "./pages/CustomerProposal";
import CustomerShowroom from "./pages/CustomerShowroom";
import MaterialRequest from "./pages/MaterialRequest";
import Quotations from "./pages/Quotations";
import Variations from "./pages/Variations";
import MaterialCatalog from "./pages/MaterialCatalog";
import PricingSettings from "./pages/PricingSettings";
import QuotationBuilder from "./pages/QuotationBuilder";
import PortalDashboard from "./pages/PortalDashboard";
import CustomerDatabase from "./pages/CustomerDatabase";
import InstallerDatabase from "./pages/InstallerDatabase";
import Tasks from "./pages/Tasks";
import Projects from "./pages/Projects";
import ProjectSites from "./pages/ProjectSites";
import ProjectAreas from "./pages/ProjectAreas";
import ProjectSiteDashboard from "./pages/ProjectSiteDashboard";
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
import WorkOrders from "./pages/WorkOrders";
import WorkOrderDashboard from "./pages/WorkOrderDashboard";
import DailyReports from "./pages/DailyReports";
import MyWork from "./pages/MyWork";
import MyWorkDailyReport from "./pages/MyWorkDailyReport";
import DailyReportDashboard from "./pages/DailyReportDashboard";
import PayrollPeriodDashboard from "./pages/PayrollPeriodDashboard";
import WorkTimeLogs from "./pages/WorkTimeLogs";
import PayrollEntries from "./pages/PayrollEntries";
import Employees from "./pages/Employees";
import PayrollPeriods from "./pages/PayrollPeriods";
import Suppliers from "./pages/Suppliers";
import MasterData from "./pages/MasterData";
import ProductAttributes from "./pages/ProductAttributes";
import ProductCodeManagement from "./pages/ProductCodeManagement";
import Products from "./pages/Products";
import StockRequests from "./pages/StockRequests";
import AdminUserManagement from "./pages/AdminUserManagement";
import TelegramNotifications from "./pages/TelegramNotifications";

const queryClient = new QueryClient();

const protectedPage = (page: React.ReactNode) => (
  <ProtectedRoute>{page}</ProtectedRoute>
);

const permissionPage = (
  page: React.ReactNode,
  permissions: string[]
) => (
  <ProtectedRoute>
    <PermissionRoute anyOf={permissions}>{page}</PermissionRoute>
  </ProtectedRoute>
);

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
            <Route path="/account-access" element={<AccountAccessPage />} />

            <Route path="/portal" element={protectedPage(<PortalDashboard />)} />
            <Route path="/dashboard" element={protectedPage(<PortalDashboard />)} />

            <Route path="/customers" element={protectedPage(<CustomerDatabase />)} />
            <Route path="/projects" element={protectedPage(<Projects />)} />
            <Route path="/project-sites" element={protectedPage(<ProjectSites />)} />
            <Route
              path="/project-sites/:siteId"
              element={protectedPage(<ProjectSiteDashboard />)}
            />
            <Route path="/project-areas" element={protectedPage(<ProjectAreas />)} />

            <Route path="/work-orders" element={protectedPage(<WorkOrders />)} />
            <Route
              path="/work-orders/:workOrderId"
              element={protectedPage(<WorkOrderDashboard />)}
            />
            <Route path="/daily-reports" element={protectedPage(<DailyReports />)} />
            <Route
              path="/daily-reports/:reportId"
              element={protectedPage(<DailyReportDashboard />)}
            />
            <Route path="/my-work" element={protectedPage(<MyWork />)} />
            <Route
              path="/my-work/:workOrderId"
              element={protectedPage(<MyWorkDailyReport />)}
            />
            <Route
              path="/work-time-logs"
              element={protectedPage(<WorkTimeLogs />)}
            />

            <Route path="/quotations" element={protectedPage(<Quotations />)} />
            <Route path="/variations" element={protectedPage(<Variations />)} />
            <Route
              path="/material-requirements"
              element={protectedPage(<MaterialRequest />)}
            />
            <Route
              path="/stock-requests"
              element={protectedPage(<StockRequests />)}
            />

            <Route path="/employees" element={protectedPage(<Employees />)} />
            <Route path="/suppliers" element={protectedPage(<Suppliers />)} />
            <Route
              path="/payroll-periods"
              element={protectedPage(<PayrollPeriods />)}
            />
            <Route
              path="/payroll-periods/:payrollPeriodId"
              element={protectedPage(<PayrollPeriodDashboard />)}
            />
            <Route
              path="/payroll-entries"
              element={protectedPage(<PayrollEntries />)}
            />
            <Route path="/payroll" element={protectedPage(<Payroll />)} />

            <Route path="/products" element={protectedPage(<Products />)} />
            <Route
              path="/product-attributes"
              element={protectedPage(<ProductAttributes />)}
            />
            <Route
              path="/product-code-management"
              element={protectedPage(<ProductCodeManagement />)}
            />
            <Route path="/master-data" element={protectedPage(<MasterData />)} />

            <Route path="/contacts" element={protectedPage(<Contacts />)} />
            <Route path="/team" element={protectedPage(<Team />)} />
            <Route path="/photos" element={protectedPage(<PhotoApproval />)} />
            <Route path="/tasks" element={protectedPage(<Tasks />)} />
            <Route
              path="/project-timeline"
              element={protectedPage(<ProjectTimeline />)}
            />
            <Route
              path="/admin/users"
              element={permissionPage(<AdminUserManagement />, [
                "users.view",
                "users.manage_accounts",
              ])}
            />
            <Route
              path="/admin/telegram-notifications"
              element={permissionPage(<TelegramNotifications />, [
                "telegram_notifications.view",
                "telegram_notifications.manage",
              ])}
            />

            <Route path="/settings" element={protectedPage(<SettingsPage />)} />

            <Route path="/tech" element={protectedPage(<TechHome />)} />
            <Route
              path="/tech/materials"
              element={protectedPage(<TechMaterials />)}
            />
            <Route path="/tech/report" element={protectedPage(<TechReport />)} />
            <Route path="/tech/leave" element={protectedPage(<TechLeave />)} />

            {/* Legacy/internal pages are also gated to prevent Pending accounts
                from bypassing application access through a direct URL. */}
            <Route path="/workflow" element={protectedPage(<SystemWorkflow />)} />
            <Route path="/job-manager" element={protectedPage(<JobManager />)} />
            <Route
              path="/customer-update"
              element={protectedPage(<CustomerUpdate />)}
            />
            <Route
              path="/customer-tracking"
              element={protectedPage(<CustomerTracking />)}
            />
            <Route path="/pricing" element={protectedPage(<PricingSettings />)} />
            <Route
              path="/quotation-builder"
              element={protectedPage(<QuotationBuilder />)}
            />
            <Route path="/materials" element={protectedPage(<MaterialCatalog />)} />
            <Route path="/showroom" element={protectedPage(<CustomerShowroom />)} />
            <Route path="/proposal" element={protectedPage(<CustomerProposal />)} />
            <Route path="/job-card" element={protectedPage(<JobCard />)} />
            <Route
              path="/installers"
              element={protectedPage(<InstallerDatabase />)}
            />
            <Route
              path="/customer-check"
              element={protectedPage(<CustomerCheck />)}
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;