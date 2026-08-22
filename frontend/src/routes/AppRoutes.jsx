import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CustomerLayout from '../layouts/CustomerLayout';
import ProviderLayout from '../layouts/ProviderLayout';
import AdminLayout from '../layouts/AdminLayout';
import CustomerHomePage from '../pages/CustomerHomePage';
import CustomerCategoriesPage from '../pages/CustomerCategoriesPage';
import CustomerOrdersPage from '../pages/CustomerOrdersPage';
import CustomerOrderDetailsPage from '../pages/CustomerOrderDetailsPage';
import CustomerSubscriptionsPage from '../pages/CustomerSubscriptionsPage';
import CustomerSubscriptionDetailsPage from '../pages/CustomerSubscriptionDetailsPage';
import ServiceListingPage from '../pages/ServiceListingPage';
import ServiceDetailsPage from '../pages/ServiceDetailsPage';
import ProviderDetailsPage from '../pages/ProviderDetailsPage';
import BookingPage from '../pages/BookingPage';
import ProviderDashboardPage from '../pages/ProviderDashboardPage';
import ProviderProfilePage from '../pages/ProviderProfilePage';
import ProviderServicesPage from '../pages/ProviderServicesPage';
import ProviderServicePlansPage from '../pages/ProviderServicePlansPage';
import ProviderServiceAreasPage from '../pages/ProviderServiceAreasPage';
import ProviderAvailabilityPage from '../pages/ProviderAvailabilityPage';
import ProviderOrdersPage from '../pages/ProviderOrdersPage';
import ProviderDeliveriesPage from '../pages/ProviderDeliveriesPage';
import ProviderExpensesPage from '../pages/ProviderExpensesPage';
import ProviderAccountingPage from '../pages/ProviderAccountingPage';
import ProviderAnalyticsPage from '../pages/ProviderAnalyticsPage';
import ProviderSettlementsPage from '../pages/ProviderSettlementsPage';
import ProviderKycPage from '../pages/ProviderKycPage';
import ProviderBankAccountPage from '../pages/ProviderBankAccountPage';
import ProviderSupportPage from '../pages/ProviderSupportPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import AdminUsersPage from '../pages/AdminUsersPage';
import AdminUserDetailsPage from '../pages/AdminUserDetailsPage';
import AdminProvidersPage from '../pages/AdminProvidersPage';
import AdminProviderDetailsPage from '../pages/AdminProviderDetailsPage';
import AdminKycPage from '../pages/AdminKycPage';
import AdminKycDetailsPage from '../pages/AdminKycDetailsPage';
import AdminCategoriesPage from '../pages/AdminCategoriesPage';
import AdminServiceModerationPage from '../pages/AdminServiceModerationPage';
import AdminServiceAreasPage from '../pages/AdminServiceAreasPage';
import AdminOrdersPage from '../pages/AdminOrdersPage';
import AdminOrderDetailsPage from '../pages/AdminOrderDetailsPage';
import AdminSubscriptionsPage from '../pages/AdminSubscriptionsPage';
import AdminSubscriptionDetailsPage from '../pages/AdminSubscriptionDetailsPage';
import AdminDeliveriesPage from '../pages/AdminDeliveriesPage';
import AdminCouponsPage from '../pages/AdminCouponsPage';
import AdminCommissionRulesPage from '../pages/AdminCommissionRulesPage';
import AdminSettlementsPage from '../pages/AdminSettlementsPage';
import AdminSettlementDetailsPage from '../pages/AdminSettlementDetailsPage';
import AdminRefundsPage from '../pages/AdminRefundsPage';
import AdminReviewsPage from '../pages/AdminReviewsPage';
import AdminSupportPage from '../pages/AdminSupportPage';
import AdminReportsPage from '../pages/AdminReportsPage';
import AdminAuditLogsPage from '../pages/AdminAuditLogsPage';
import AdminSettingsPage from '../pages/AdminSettingsPage';
import RolePlaceholderPage from '../pages/RolePlaceholderPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import RoleGuard from './RoleGuard';

function ProtectedRoute() {
  const { isAuthenticated, isReady } = useAuth();

  if (!isReady) {
    return <div className="route-loading">Loading...</div>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/customer/*" element={<RoleGuard allowedRoles={['customer']} fallbackPath="/login"><CustomerLayout /></RoleGuard>}>
          <Route index element={<CustomerHomePage />} />
          <Route path="categories" element={<CustomerCategoriesPage />} />
          <Route path="services" element={<ServiceListingPage />} />
          <Route path="services/:id" element={<ServiceDetailsPage />} />
          <Route path="providers/:id" element={<ProviderDetailsPage />} />
          <Route path="booking" element={<BookingPage />} />
          <Route path="orders" element={<CustomerOrdersPage />} />
          <Route path="orders/:id" element={<CustomerOrderDetailsPage />} />
          <Route path="subscriptions" element={<CustomerSubscriptionsPage />} />
          <Route path="subscriptions/:id" element={<CustomerSubscriptionDetailsPage />} />
          <Route path="wallet" element={<RolePlaceholderPage title="Wallet" subtitle="Wallet interactions will be implemented in later phases." />} />
          <Route path="profile" element={<RolePlaceholderPage title="Profile" subtitle="Customer profile is reserved for a later phase." />} />
          <Route path="*" element={<RolePlaceholderPage title="Customer workspace" subtitle="More customer sections will be added here." />} />
        </Route>

        <Route path="/provider/*" element={<RoleGuard allowedRoles={['provider']} fallbackPath="/login"><ProviderLayout /></RoleGuard>}>
          <Route index element={<ProviderDashboardPage />} />
          <Route path="profile" element={<ProviderProfilePage />} />
          <Route path="services" element={<ProviderServicesPage />} />
          <Route path="plans" element={<ProviderServicePlansPage />} />
          <Route path="service-areas" element={<ProviderServiceAreasPage />} />
          <Route path="availability" element={<ProviderAvailabilityPage />} />
          <Route path="orders" element={<ProviderOrdersPage />} />
          <Route path="deliveries" element={<ProviderDeliveriesPage />} />
          <Route path="expenses" element={<ProviderExpensesPage />} />
          <Route path="accounting" element={<ProviderAccountingPage />} />
          <Route path="analytics" element={<ProviderAnalyticsPage />} />
          <Route path="settlements" element={<ProviderSettlementsPage />} />
          <Route path="kyc" element={<ProviderKycPage />} />
          <Route path="bank-account" element={<ProviderBankAccountPage />} />
          <Route path="support" element={<ProviderSupportPage />} />
          <Route path="*" element={<RolePlaceholderPage title="Provider workspace" subtitle="Operational modules will arrive in later phases." />} />
        </Route>

        <Route path="/admin/*" element={<RoleGuard allowedRoles={['admin']} fallbackPath="/login"><AdminLayout /></RoleGuard>}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="users/:id" element={<AdminUserDetailsPage />} />
          <Route path="providers" element={<AdminProvidersPage />} />
          <Route path="providers/:id" element={<AdminProviderDetailsPage />} />
          <Route path="kyc" element={<AdminKycPage />} />
          <Route path="kyc/:id" element={<AdminKycDetailsPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="services" element={<AdminServiceModerationPage />} />
          <Route path="service-areas" element={<AdminServiceAreasPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/:id" element={<AdminOrderDetailsPage />} />
          <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
          <Route path="subscriptions/:id" element={<AdminSubscriptionDetailsPage />} />
          <Route path="deliveries" element={<AdminDeliveriesPage />} />
          <Route path="coupons" element={<AdminCouponsPage />} />
          <Route path="commission-rules" element={<AdminCommissionRulesPage />} />
          <Route path="settlements" element={<AdminSettlementsPage />} />
          <Route path="settlements/:id" element={<AdminSettlementDetailsPage />} />
          <Route path="refunds" element={<AdminRefundsPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          <Route path="support" element={<AdminSupportPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="audit-logs" element={<AdminAuditLogsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="*" element={<RolePlaceholderPage title="Admin workspace" subtitle="Reports and controls will be added in future phases." />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
