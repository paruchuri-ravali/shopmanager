import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import AppShell from './components/layout/AppShell';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProductsPage from './pages/products/ProductsPage';
import CustomersPage from './pages/customers/CustomersPage';
import SalesPage from './pages/sales/SalesPage';

export const ProtectedRoute = () => {
  const token = useAuthStore((s) => s.token);
  return token ? <AppShell><Outlet /></AppShell> : <Navigate to="/login" replace />;
};

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/products', element: <ProductsPage /> },
      { path: '/customers', element: <CustomersPage /> },
      { path: '/sales', element: <SalesPage /> }
    ]
  }
]);
