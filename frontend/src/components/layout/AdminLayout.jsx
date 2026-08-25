import React, { useState } from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import LanguageSwitcher from '../common/LanguageSwitcher';
import NotificationBell from '../common/NotificationBell';
import { FiHome, FiUsers, FiSliders, FiCheckSquare, FiAlertCircle, FiScissors, FiDollarSign, FiFolder, FiMenu, FiX, FiShield, FiCpu, FiLogOut } from 'react-icons/fi';

export default function AdminLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navItems = [
    { to: '/admin/dashboard', label: t('dashboard', { ns: 'common' }), icon: <FiHome className="w-5 h-5" /> },
    { to: '/admin/kyc', label: t('pending_kyc', { ns: 'admin' }), icon: <FiCheckSquare className="w-5 h-5" /> },
    { to: '/admin/users', label: t('users_management', { ns: 'admin' }), icon: <FiUsers className="w-5 h-5" /> },
    { to: '/admin/providers', label: 'Providers Monitor', icon: <FiSliders className="w-5 h-5" /> },
    { to: '/admin/catalog', label: 'Moderate Services', icon: <FiFolder className="w-5 h-5" /> },
    { to: '/admin/settlements', label: t('settlements', { ns: 'admin' }), icon: <FiDollarSign className="w-5 h-5" /> },
    { to: '/admin/commissions', label: t('commission_rules', { ns: 'admin' }), icon: <FiSliders className="w-5 h-5" /> },
    { to: '/admin/coupons', label: t('coupons', { ns: 'admin' }), icon: <FiScissors className="w-5 h-5" /> },
    { to: '/admin/support', label: 'Resolve Support', icon: <FiAlertCircle className="w-5 h-5" /> },
    { to: '/admin/settings', label: t('platform_settings', { ns: 'admin' }), icon: <FiCpu className="w-5 h-5" /> },
    { to: '/admin/audits', label: t('audit_logs', { ns: 'admin' }), icon: <FiShield className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-950 text-white shrink-0 border-r border-slate-800">
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-900 bg-slate-950">
          <Link to="/admin/dashboard" className="text-xl font-bold text-blue-400 font-sans tracking-wide">
            {t('app_name', { ns: 'common' })}
          </Link>
          <span className="bg-red-900/50 text-red-300 text-xs px-2 py-0.5 rounded font-medium border border-red-800">
            Admin
          </span>
        </div>

        <nav className="flex-grow py-6 px-4 space-y-1 overflow-y-auto max-h-[calc(100vh-10rem)]">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`
              }
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-900 bg-slate-950 flex flex-col space-y-3 mt-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 truncate max-w-[150px]">{user?.full_name}</span>
            <button
              onClick={logout}
              className="text-slate-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-slate-900"
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
              System Control Console
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <NotificationBell />
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-grow p-6 overflow-y-auto">
          <Outlet />
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
                <FiX className="h-6 w-6 text-white" />
              </button>
            </div>
            
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-900 bg-slate-950">
              <span className="text-xl font-bold text-blue-400 font-sans tracking-wide">
                {t('app_name', { ns: 'common' })}
              </span>
            </div>

            <nav className="flex-grow py-6 px-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white'
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
                <span className="text-xs text-slate-400">{user?.full_name}</span>
                <button
                  onClick={() => {
                    setMobileSidebarOpen(false);
                    logout();
                  }}
                  className="text-slate-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-slate-900"
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
