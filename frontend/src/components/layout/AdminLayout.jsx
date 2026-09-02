import React, { useState } from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import LanguageSwitcher from '../common/LanguageSwitcher';
import NotificationBell from '../common/NotificationBell';
import { FiHome, FiUsers, FiSliders, FiCheckSquare, FiAlertCircle, FiScissors, FiDollarSign, FiFolder, FiMenu, FiX, FiShield, FiCpu, FiLogOut, FiMap, FiCreditCard } from 'react-icons/fi';

export default function AdminLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navItems = [
    { to: '/admin/dashboard', label: t('dashboard', { ns: 'common' }), icon: <FiHome className="w-4 h-4" /> },
    { to: '/admin/payments', label: 'Payment Management', icon: <FiCreditCard className="w-4 h-4" /> },
    { to: '/admin/settlements', label: t('settlements', { ns: 'admin' }), icon: <FiDollarSign className="w-4 h-4" /> },
    { to: '/admin/commissions', label: t('commission_rules', { ns: 'admin' }), icon: <FiSliders className="w-4 h-4" /> },
    { to: '/admin/kyc', label: t('pending_kyc', { ns: 'admin' }), icon: <FiCheckSquare className="w-4 h-4" /> },
    { to: '/admin/users', label: t('users_management', { ns: 'admin' }), icon: <FiUsers className="w-4 h-4" /> },
    { to: '/admin/providers', label: 'Providers Monitor', icon: <FiSliders className="w-4 h-4" /> },
    { to: '/admin/catalog', label: 'Moderate Services', icon: <FiFolder className="w-4 h-4" /> },
    { to: '/admin/coupons', label: t('coupons', { ns: 'admin' }), icon: <FiScissors className="w-4 h-4" /> },
    { to: '/admin/support', label: 'Resolve Support', icon: <FiAlertCircle className="w-4 h-4" /> },
    { to: '/admin/settings', label: t('platform_settings', { ns: 'admin' }), icon: <FiCpu className="w-4 h-4" /> },
    { to: '/admin/audits', label: t('audit_logs', { ns: 'admin' }), icon: <FiShield className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 flex">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-350 shrink-0 border-r border-slate-800">
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950">
          <Link to="/admin/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-blue-500/10">
              <FiMap className="w-4.5 h-4.5" />
            </div>
            <span className="text-lg font-black text-white tracking-tight">
              Local<span className="text-blue-500">Loop</span>
            </span>
          </Link>
          <span className="bg-red-900/40 text-red-400 text-[10px] px-2 py-0.5 rounded-full font-bold border border-red-800 tracking-wider uppercase">
            Admin
          </span>
        </div>

        <nav className="flex-grow py-6 px-4 space-y-1 overflow-y-auto max-h-[calc(100vh-10rem)]">
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

        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col space-y-3 mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 font-bold text-xs text-slate-300 uppercase">
                {user?.full_name?.charAt(0) || 'A'}
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
      <div className="flex-grow flex flex-col min-w-0">
        {/* Top Header Navbar */}
        <header className="h-16 bg-white border-b border-slate-100 flex justify-between items-center px-6 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center">
            {/* Mobile Sidebar Hamburger */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-50 mr-4 focus:outline-none"
            >
              <FiMenu className="w-5.5 h-5.5" />
            </button>
            <h1 className="text-sm font-extrabold text-slate-800 hidden sm:block uppercase tracking-wider">
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
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setMobileSidebarOpen(false)} />
          
          {/* Sidebar Drawer */}
          <div className="relative flex flex-col w-64 max-w-xs bg-slate-950 text-slate-350 shadow-2xl">
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
                    {user?.full_name?.charAt(0) || 'A'}
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
