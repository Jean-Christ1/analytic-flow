import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Experiments from "./pages/Experiments";
import ExperimentDetails from "./pages/ExperimentDetails";
import Projects from "./pages/Projects";
import ProjectTemplates from "./pages/ProjectTemplates";
import ProjectDetails from "./pages/ProjectDetails";
import Models from "./pages/Models";
import ModelDetails from "./pages/ModelDetails";
import ModelComparison from "./pages/ModelComparison";
import Deployments from "./pages/Deployments";
import WorkspacesHierarchical from "./pages/WorkspacesHierarchical";
import DataCatalog from "./pages/DataCatalog";
import Monitoring from "./pages/Monitoring";
import FinOps from "./pages/FinOps";
import Marketplace from "./pages/Marketplace";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import ApplicationDetails from "./pages/ApplicationDetails";
import Compliance from "./pages/Compliance";
import Security from "./pages/Security";
import AuditLogs from "./pages/AuditLogs";
import Documentation from "./pages/Documentation";
import NotFound from "./pages/NotFound";
import EnergyDashboard from "./pages/EnergyDashboard";
import QualityControlComparison from "./pages/QualityControlComparison";
import PredictiveMaintenanceDashboard from "./pages/PredictiveMaintenanceDashboard";
import UsersManagement from "./pages/governance/UsersManagement";
import RolesManagement from "./pages/governance/RolesManagement";
import PermissionsManagement from "./pages/governance/PermissionsManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CurrencyProvider>
        <BrowserRouter>
          <AuthProvider>
            <SidebarProvider>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Auth />} />
                
                {/* Protected routes */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/experiments" element={<ProtectedRoute><Experiments /></ProtectedRoute>} />
                <Route path="/experiments/:id" element={<ProtectedRoute><ExperimentDetails /></ProtectedRoute>} />
                <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
                <Route path="/projects/templates" element={<ProtectedRoute><ProjectTemplates /></ProtectedRoute>} />
                <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
                <Route path="/models" element={<ProtectedRoute><Models /></ProtectedRoute>} />
                <Route path="/models/:id" element={<ProtectedRoute><ModelDetails /></ProtectedRoute>} />
                <Route path="/models/compare" element={<ProtectedRoute><ModelComparison /></ProtectedRoute>} />
                <Route path="/deployments" element={<ProtectedRoute><Deployments /></ProtectedRoute>} />
                <Route path="/workspaces" element={<ProtectedRoute><WorkspacesHierarchical /></ProtectedRoute>} />
                <Route path="/data-catalog" element={<ProtectedRoute><DataCatalog /></ProtectedRoute>} />
                <Route path="/monitoring" element={<ProtectedRoute><Monitoring /></ProtectedRoute>} />
                <Route path="/finops" element={<ProtectedRoute><FinOps /></ProtectedRoute>} />
                <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
                <Route path="/marketplace/:id" element={<ProtectedRoute><ApplicationDetails /></ProtectedRoute>} />
                <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/compliance" element={<ProtectedRoute><Compliance /></ProtectedRoute>} />
                <Route path="/security" element={<ProtectedRoute><Security /></ProtectedRoute>} />
                <Route path="/audit-logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
                <Route path="/documentation" element={<ProtectedRoute><Documentation /></ProtectedRoute>} />
                
                {/* Governance IAM Routes */}
                <Route path="/governance/users" element={<ProtectedRoute><UsersManagement /></ProtectedRoute>} />
                <Route path="/governance/roles" element={<ProtectedRoute><RolesManagement /></ProtectedRoute>} />
                <Route path="/governance/permissions" element={<ProtectedRoute><PermissionsManagement /></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </SidebarProvider>
          </AuthProvider>
        </BrowserRouter>
      </CurrencyProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
