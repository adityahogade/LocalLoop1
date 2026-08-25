import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import CustomerLayout from '../components/layout/CustomerLayout';
import ProviderLayout from '../components/layout/ProviderLayout';
import AdminLayout from '../components/layout/AdminLayout';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ProviderRegister from '../pages/auth/ProviderRegister';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';

// Customer Pages
import Catalog from '../pages/customer/Catalog';
import ProviderProfile from '../pages/customer/ProviderProfile';
import BookService from '../pages/customer/BookService';
import SubscriptionsList from '../pages/customer/SubscriptionsList';
import BookingsList from '../pages/customer/BookingsList';
import Wallet from '../pages/customer/Wallet';
import InvoicesList from '../pages/customer/InvoicesList';
import SupportTickets from '../pages/customer/SupportTickets';
import CustomerProfile from '../pages/customer/CustomerProfile';

// Provider Pages
import ProviderDashboard from '../pages/provider/ProviderDashboard';
import ProviderOnboarding from '../pages/provider/ProviderOnboarding';
import ProviderServices from '../pages/provider/ProviderServices';
import ProviderExpenses from '../pages/provider/ProviderExpenses';
import ProviderBookings from '../pages/provider/ProviderBookings';
import ProviderSettlements from '../pages/provider/ProviderSettlements';
import ProviderSupport from '../pages/provider/ProviderSupport';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminKyc from '../pages/admin/AdminKyc';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminProviders from '../pages/admin/AdminProviders';
import AdminCatalog from '../pages/admin/AdminCatalog';
import AdminSettlements from '../pages/admin/AdminSettlements';
import AdminCommissions from '../pages/admin/AdminCommissions';
import AdminCoupons from '../pages/admin/AdminCoupons';
import AdminSupport from '../pages/admin/AdminSupport';
import AdminSettings from '../pages/admin/AdminSettings';
import AdminAudits from '../pages/admin/AdminAudits';

// Global error pages
import NotFound from '../pages/NotFound';
import Unauthorized from '../pages/Unauthorized';

// Protected Route Guard Component
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* AUTH ROUTES */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/provider-register" element={<ProviderRegister />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* ERROR CODES */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* CUSTOMER PORTAL (Root Public / Catalog browse) */}
      <Route path="/" element={<CustomerLayout />}>
        <Route index element={<Catalog />} />
        <Route path="providers/:id" element={<ProviderProfile />} />
        
        {/* Customer Protected Pages */}
        <Route
          path="customer/book/:serviceId"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <BookService />
            </ProtectedRoute>
          }
        />
        <Route
          path="customer/subscriptions"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <SubscriptionsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="customer/bookings"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <BookingsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="customer/wallet"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <Wallet />
            </ProtectedRoute>
          }
        />
        <Route
          path="customer/invoices"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <InvoicesList />
            </ProtectedRoute>
          }
        />
        <Route
          path="customer/support"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <SupportTickets />
            </ProtectedRoute>
          }
        />
        <Route
          path="customer/profile"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerProfile />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* PROVIDER CONSOLE */}
      <Route
        path="/provider"
        element={
          <ProtectedRoute allowedRoles={['provider']}>
            <ProviderLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/provider/dashboard" replace />} />
        <Route path="dashboard" element={<ProviderDashboard />} />
        <Route path="onboarding" element={<ProviderOnboarding />} />
        <Route path="services" element={<ProviderServices />} />
        <Route path="expenses" element={<ProviderExpenses />} />
        <Route path="bookings" element={<ProviderBookings />} />
        <Route path="settlements" element={<ProviderSettlements />} />
        <Route path="support" element={<ProviderSupport />} />
      </Route>

      {/* ADMIN CONSOLE */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="kyc" element={<AdminKyc />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="providers" element={<AdminProviders />} />
        <Route path="catalog" element={<AdminCatalog />} />
        <Route path="settlements" element={<AdminSettlements />} />
        <Route path="commissions" element={<AdminCommissions />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="support" element={<AdminSupport />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="audits" element={<AdminAudits />} />
      </Route>

      {/* 404 FALLBACK */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
