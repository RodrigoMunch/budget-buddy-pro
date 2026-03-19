import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { FinanceProvider } from "@/contexts/FinanceContext";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import CategoriesPage from "./pages/CategoriesPage";
import ProfilePage from "./pages/ProfilePage";
import InstallmentsPage from "./pages/InstallmentsPage";
import HistoryPage from "./pages/HistoryPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/auth" replace />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
    <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
    <Route path="/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <FinanceProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </FinanceProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
