import { Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { RoleRoute } from './components/layout/RoleRoute';
import { LoginPage } from './pages/LoginPage';
import { ProductsPage } from './pages/ProductsPage';
import { SalePage } from './pages/SalePage';
import { CustomOrdersPage } from './pages/CustomOrdersPage';
import { DashboardPage } from './pages/DashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { StockMovementsPage } from './pages/StockMovementsPage';
import { StockAlertsPage } from './pages/StockAlertsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { SaleTicketPage } from './pages/SaleTicketPage';
import { SettingsPage } from './pages/SettingsPage';
import { SalesReportPage } from './pages/SalesReportPage';
import { CashRegisterPage } from './pages/CashRegisterPage';
import { UsersPage } from './pages/UsersPage';

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  useEffect(() => {
    document.documentElement.dataset.theme = localStorage.getItem('btq-theme') || 'light';
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/vente" element={<SalePage />} />
        <Route path="/ticket/vente" element={<SaleTicketPage />} />
        <Route
          path="/produits"
          element={
            <RoleRoute role="gerant">
              <ProductsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <RoleRoute role="gerant">
              <CategoriesPage />
            </RoleRoute>
          }
        />
        <Route path="/commandes" element={<CustomOrdersPage />} />
        <Route
          path="/stock"
          element={
            <RoleRoute role="gerant">
              <StockMovementsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/alertes-stock"
          element={
            <RoleRoute role="gerant">
              <StockAlertsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RoleRoute role="gerant">
              <DashboardPage />
            </RoleRoute>
          }
        />
        <Route
          path="/ventes"
          element={
            <RoleRoute role="gerant">
              <SalesReportPage />
            </RoleRoute>
          }
        />
        <Route
          path="/caisse"
          element={
            <RoleRoute role="gerant">
              <CashRegisterPage />
            </RoleRoute>
          }
        />
        <Route
          path="/utilisateurs"
          element={
            <RoleRoute role="gerant">
              <UsersPage />
            </RoleRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <RoleRoute role="gerant">
              <SettingsPage />
            </RoleRoute>
          }
        />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
