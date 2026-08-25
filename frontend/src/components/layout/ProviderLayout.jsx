import React, { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { providerApi } from '../../api/provider';
import LanguageSwitcher from '../common/LanguageSwitcher';
import NotificationBell from '../common/NotificationBell';
import { FiHome, FiTrendingUp, FiSettings, FiGrid, FiDollarSign, FiPercent, FiBriefcase, FiLifeBuoy, FiLogOut, FiMenu, FiX, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';

export default function ProviderLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [kycStatus, setKycStatus] = useState('pending');
  const [isActive, setIsActive] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const fetchProviderProfile = async () => {
    try {
      const res = await providerApi.getProfile();
      if (res?.success && res?.data) {
        setKycStatus(res.data.kyc_status);
        setIsActive(res.data.is_active);
      }
    } catch (err) {
      console.error('Failed to fetch provider status:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProviderProfile();
    }
  }, [user]);

  const navItems = [
    { to: '/provider/dashboard', label: t('dashboard', { ns: 'common' }), icon: <FiHome className="w-5 h-5" /> },
    { to: '/provider/bookings', label: t('bookings', { ns: 'provider' }), icon: <FiBriefcase className="w-5 h-5" /> },
    { to: '/provider/services', label: t('my_services', { ns: 'provider' }), icon: <FiGrid className="w-5 h-5" /> },
    { to: '/provider/expenses', label: t('operating_expenses', { ns: 'provider' }), icon: <FiTrendingUp className="w-5 h-5" /> },
    { to: '/provider/settlements', label: t('settlement_requests', { ns: 'provider' }), icon: <FiDollarSign className="w-5 h-5" /> },
    { to: '/provider/onboarding', label: t('business_profile', { ns: 'provider' }), icon: <FiSettings className="w-5 h-5" /> },
    { to: '/provider/support', label: t('support_tickets', { ns: 'customer' }), icon: <FiLifeBuoy className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white shrink-0 border-r border-slate-800">
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950">
          <Link to="/provider/dashboard" className="text-xl font-bold text-blue-400 font-sans tracking-wide">
            {t('app_name', { ns: 'common' })}
          </Link>
          <span className="bg-blue-900/50 text-blue-300 text-xs px-2 py-0.5 rounded font-medium border border-blue-800">
            Provider
          </span>
        </div>

        <nav className="flex-grow py-6 px-4 space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`
              }
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{user?.full_name}</span>
            <button
              onClick={logout}
              className="text-slate-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-slate-800"
              title="Logout"
            >
              <FiLogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0">
        {/* Top Header Navbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex justify-between items-center px-6 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center">
            {/* Mobile Sidebar Hamburger */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 text-gray-500 hover:text-gray-900 rounded-md focus:outline-none focus:bg-gray-100 mr-4"
            >
              <FiMenu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-slate-800 hidden sm:block">
              {t('dashboard', { ns: 'common' })} Console
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <NotificationBell />
          </div>
        </header>

        {/* KYC Status Warnings / Banner */}
        {kycStatus !== 'approved' && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-start space-x-3 text-amber-800">
            <FiAlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-normal">
              <span className="font-semibold">KYC Verification Required</span>: Your store profile is in <span className="font-semibold text-slate-900 underline">{kycStatus}</span> status. Active listings, pricing plans, service areas, and availability grids can only be customized or published once Admin approves your KYC documents on the Onboarding page.
            </div>
          </div>
        )}

        {/* Content Outlet */}
        <main className="flex-grow p-6 overflow-y-auto">
          <Outlet context={{ fetchProfile: fetchProviderProfile }} />
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          
          {/* Sidebar Drawer */}
          <div className="relative flex flex-col w-64 max-w-xs bg-slate-950 text-white animate-slide-in">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <FiX className="h-6 h-6 text-white" />
              </button>
            </div>
            
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950">
              <span className="text-xl font-bold text-blue-400 font-sans tracking-wide">
                {t('app_name', { ns: 'common' })}
              </span>
            </div>

            <nav className="flex-grow py-6 px-4 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    }`
                  }
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{user?.full_name}</span>
                <button
                  onClick={() => {
                    setMobileSidebarOpen(false);
                    logout();
                  }}
                  className="text-slate-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-slate-800"
                >
                  <FiLogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
