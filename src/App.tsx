import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DashboardAnalytics from "./pages/DashboardAnalytics";
import DashboardBuilder from "./pages/DashboardBuilder";
import UploadUtility from "./pages/UploadUtility";
import Upload from "./pages/Upload";
import DataSources from "./pages/DataSources";
import DataMarts from "./pages/DataMarts";
import AccessManagement from "./pages/AccessManagement";
import ThemeLibrary from "./pages/ThemeLibrary";
import ThemeBuilder from "./pages/ThemeBuilder";
import ChartBuilder from "./pages/ChartBuilder";
import Scheduler from "./pages/Scheduler";
import Settings from "./pages/Settings";
import DatabaseManagement from "./pages/DatabaseManagement";
import DashboardViewer from "./pages/DashboardViewer";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ProtectedRoute><ResetPassword /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard-analytics" element={<DashboardAnalytics />} />
              <Route path="/dashboard-builder" element={<DashboardBuilder />} />
              <Route path="/upload-utility" element={<UploadUtility />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/data-sources" element={<DataSources />} />
              <Route path="/data-marts" element={<DataMarts />} />
              <Route path="/access-management" element={<AccessManagement />} />
              <Route path="/theme-library" element={<ThemeLibrary />} />
              <Route path="/themes" element={<ThemeBuilder />} />
              <Route path="/chart-builder" element={<ChartBuilder />} />
              <Route path="/scheduler" element={<Scheduler />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/database-management" element={<DatabaseManagement />} />
              <Route path="/dashboard/:id" element={<DashboardViewer />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
