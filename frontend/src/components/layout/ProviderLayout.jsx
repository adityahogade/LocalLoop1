import React, { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { providerApi } from '../../api/provider';
import LanguageSwitcher from '../common/LanguageSwitcher';
import NotificationBell from '../common/NotificationBell';
import { FiHome, FiTrendingUp, FiSettings, FiGrid, FiDollarSign, FiPercent, FiBriefcase, FiLifeBuoy, FiLogOut, FiMenu, FiX, FiCheckCircle, FiAlertTriangle, FiMap } from 'react-icons/fi';

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
    { to: '/provider/dashboard', label: t('dashboard', { ns: 'common' }), icon: <FiHome className="w-4 h-4" /> },
    { to: '/provider/bookings', label: t('bookings', { ns: 'provider' }), icon: <FiBriefcase className="w-4 h-4" /> },
    { to: '/provider/services', label: t('my_services', { ns: 'provider' }), icon: <FiGrid className="w-4 h-4" /> },
    { to: '/provider/expenses', label: t('operating_expenses', { ns: 'provider' }), icon: <FiTrendingUp className="w-4 h-4" /> },
    { to: '/provider/settlements', label: t('settlement_requests', { ns: 'provider' }), icon: <FiDollarSign className="w-4 h-4" /> },
    { to: '/provider/onboarding', label: t('business_profile', { ns: 'provider' }), icon: <FiSettings className="w-4 h-4" /> },
    { to: '/provider/support', label: t('support_tickets', { ns: 'customer' }), icon: <FiLifeBuoy className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 flex w-full max-w-full overflow-x-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 shrink-0 border-r border-slate-800">
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950">
          <Link to="/provider/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-blue-500/10">
              <FiMap className="w-4.5 h-4.5" />
            </div>
            <span className="text-lg font-black text-white tracking-tight">
              Local<span className="text-blue-500">Loop</span>
            </span>
          </Link>
          <span className="bg-blue-900/40 text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-bold border border-blue-800 tracking-wider uppercase">
            Provider
          </span>
        </div>

        <nav className="flex-grow py-6 px-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
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
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 font-bold text-xs text-slate-300 uppercase">
                {user?.full_name?.charAt(0) || 'P'}
              </div>
              <span className="text-xs font-bold text-slate-300 truncate max-w-[120px]">{user?.full_name}</span>
            </div>
            <button
              onClick={logout}
              className="text-slate-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-slate-800"
              title="Logout"
            >
              <FiLogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0 w-full max-w-full overflow-x-hidden">
        {/* Top Header Navbar */}
        <header className="h-16 bg-white border-b border-slate-100 flex justify-between items-center px-4 sm:px-6 sticky top-0 z-30 shadow-sm min-w-0">
          <div className="flex items-center">
            {/* Mobile Sidebar Hamburger */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-50 mr-2 sm:mr-4 focus:outline-none"
            >
              <FiMenu className="w-5.5 h-5.5" />
            </button>
            <h1 className="text-xs sm:text-sm font-extrabold text-slate-800 hidden xs:block uppercase tracking-wider">
              {t('dashboard', { ns: 'common' })} Console
            </h1>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <LanguageSwitcher />
            <NotificationBell />
          </div>
        </header>

        {/* KYC Status Warnings / Banner */}
        {kycStatus !== 'approved' && (
          <div className="bg-amber-50 border-b border-amber-100 px-4 sm:px-6 py-3 flex items-start space-x-3 text-amber-800 shadow-sm animate-pulse min-w-0">
            <FiAlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-normal font-semibold">
              KYC Verification Required: Your store profile is in <span className="underline">{kycStatus}</span> status. Active listings, pricing plans, service areas, and availability grids can only be customized or published once Admin approves your KYC documents on the Onboarding page.
            </div>
          </div>
        )}

        {/* Content Outlet */}
        <main className="flex-grow p-4 sm:p-6 overflow-y-auto min-w-0 w-full max-w-full">
          <Outlet context={{ fetchProfile: fetchProviderProfile }} />
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setMobileSidebarOpen(false)} />
          
          {/* Sidebar Drawer */}
          <div className="relative flex flex-col w-64 max-w-[80vw] bg-slate-950 text-slate-350 shadow-2xl">
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <FiX className="w-4.5 h-4.5" />
              </button>
            </div>
            
            <div className="h-16 flex items-center px-6 border-b border-slate-900 bg-slate-950">
              <span className="text-lg font-black text-white tracking-tight">
                Local<span className="text-blue-500">Loop</span>
              </span>
            </div>

            <nav className="flex-grow py-6 px-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                    }`
                  }
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="p-4 border-t border-slate-900 bg-slate-950 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-slate-800 rounded-full flex items-center justify-center font-bold text-[10px] text-slate-300 uppercase">
                    {user?.full_name?.charAt(0) || 'P'}
                  </div>
                  <span className="text-xs font-bold text-slate-300 truncate max-w-[120px]">{user?.full_name}</span>
                </div>
                <button
                  onClick={() => {
                    setMobileSidebarOpen(false);
                    logout();
                  }}
                  className="text-slate-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-slate-900"
                >
                  <FiLogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
