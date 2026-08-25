import React, { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import LanguageSwitcher from '../common/LanguageSwitcher';
import NotificationBell from '../common/NotificationBell';
import { FiLogOut, FiMenu, FiX, FiUser } from 'react-icons/fi';

export default function CustomerLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: t('browse_services', { ns: 'customer' }) },
    { to: '/customer/subscriptions', label: t('my_subscriptions', { ns: 'customer' }) },
    { to: '/customer/bookings', label: t('my_bookings', { ns: 'customer' }) },
    { to: '/customer/wallet', label: t('wallet_balance', { ns: 'customer' }) },
    { to: '/customer/invoices', label: t('invoices', { ns: 'customer' }) },
    { to: '/customer/support', label: t('support_tickets', { ns: 'customer' }) },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Logo */}
              <Link to="/" className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-blue-600 font-sans tracking-wide">
                  {t('app_name', { ns: 'common' })}
                </span>
              </Link>

              {/* Desktop Nav Links */}
              <nav className="hidden md:ml-8 md:flex md:space-x-4">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `inline-flex items-center px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
                        isActive
                          ? 'text-blue-600 bg-blue-50/50'
                          : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Right Nav Utilities */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block">
                <LanguageSwitcher />
              </div>
              
              <NotificationBell />

              {/* Profile Link & Logout */}
              {user ? (
                <div className="flex items-center space-x-3 border-l border-gray-200 pl-4">
                  <Link
                    to="/customer/profile"
                    className="flex items-center text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <FiUser className="w-5 h-5 mr-1 text-gray-400" />
                    <span className="hidden lg:inline">{user.full_name}</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
                    title={t('logout', { ns: 'common' })}
                  >
                    <FiLogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="text-sm font-semibold text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md"
                  >
                    {t('login', { ns: 'common' })}
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md shadow-sm"
                  >
                    {t('signup', { ns: 'common' })}
                  </Link>
                </div>
              )}

              {/* Mobile Burger Menu Button */}
              <div className="flex items-center md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
                >
                  {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-gray-200 bg-white px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-base font-semibold ${
                    isActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <div className="border-t border-gray-100 pt-3 px-3 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Language:</span>
              <LanguageSwitcher />
            </div>
            {user && (
              <div className="border-t border-gray-100 pt-3 px-3 flex justify-between items-center">
                <Link
                  to="/customer/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center text-sm font-semibold text-gray-700"
                >
                  <FiUser className="w-5 h-5 mr-1" />
                  {user.full_name}
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center text-sm font-semibold text-red-600 hover:text-red-700"
                >
                  <FiLogOut className="w-5 h-5 mr-1" />
                  {t('logout', { ns: 'common' })}
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} {t('app_name', { ns: 'common' })}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
