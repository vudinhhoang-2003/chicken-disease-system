import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import theme from './theme';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import DiagnosisLogs from './pages/DiagnosisLogs';
import KnowledgeBase from './pages/KnowledgeBase';
import GeneralKnowledge from './pages/GeneralKnowledge';
import UsersPage from './pages/UsersPage';
import LoginPage from './pages/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';

const queryClient = new QueryClient();

// Component bảo vệ route
const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

function AppContent() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Các route yêu cầu đăng nhập */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="logs" element={<DiagnosisLogs />} />
            <Route path="knowledge" element={<KnowledgeBase />} />
            <Route path="general-knowledge" element={<GeneralKnowledge />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="*" element={<div>Page Not Found</div>} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
