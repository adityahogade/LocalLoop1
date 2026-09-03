import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const loggedUser = await login(email, password);
      const userRole = loggedUser?.role?.toLowerCase();

      // Validate if return URL from navigation state matches the newly logged-in user's role
      const rawFrom = location.state?.from?.pathname;
      const isFromValid = (fromPath, role) => {
        if (!fromPath || typeof fromPath !== 'string') return false;
        const path = fromPath.trim();
        if (path === '/login' || path === '/unauthorized' || path === '/') return false;
        if (role === 'admin') return path.startsWith('/admin');
        if (role === 'provider') return path.startsWith('/provider');
        if (role === 'customer') return !path.startsWith('/provider') && !path.startsWith('/admin');
        return false;
      };

      const getDefaultDashboard = (role) => {
        if (role === 'admin') return '/admin/dashboard';
        if (role === 'provider') return '/provider/dashboard';
        return '/';
      };

      const targetPath = isFromValid(rawFrom, userRole)
        ? rawFrom
        : getDefaultDashboard(userRole);

      navigate(targetPath, { replace: true });
    } catch (err) {
      console.error('Login request failed:', err);
      setError(err.message || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900 font-sans tracking-wide">
          {t('login', { ns: 'common' })} to {t('app_name', { ns: 'common' })}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-semibold">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                {t('email', { ns: 'common' })}
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                {t('password', { ns: 'common' })}
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link to="/forgot-password" className="font-semibold text-blue-600 hover:text-blue-500">
                  Forgot password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Signing in...' : t('login', { ns: 'common' })}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <p className="text-center text-sm text-gray-600">
              Need a customer account?{' '}
              <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500">
                Register as Customer
              </Link>
            </p>
            <p className="text-center text-sm text-gray-600 mt-2">
              Want to sell services?{' '}
              <Link to="/provider-register" className="font-semibold text-blue-600 hover:text-blue-500">
                Register as Provider
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
