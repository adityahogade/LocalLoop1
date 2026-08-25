import React, { createContext, useState, useEffect, useContext } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');

      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser));
          
          // Verify session freshness with backend /me call
          const res = await authApi.getMe();
          if (res?.success && res?.data) {
            // Keep role and ID sync from backend
            const updatedUser = {
              ...JSON.parse(storedUser),
              id: res.data.userId,
              role: res.data.role,
            };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } catch (err) {
          console.error('Session validation failed:', err);
          // Token is invalid or expired, clear it
          logoutLocal();
        }
      }
      setLoading(false);
    };

    initializeAuth();

    // Listen for global logout events triggered by Axios interceptor
    const handleGlobalLogout = () => {
      setUser(null);
    };
    window.addEventListener('auth-logout', handleGlobalLogout);

    return () => {
      window.removeEventListener('auth-logout', handleGlobalLogout);
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      if (res?.success && res?.data) {
        const { user: userData, accessToken, refreshToken } = res.data;
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
        setLoading(false);
        return userData;
      }
      throw new Error('Login failed: Invalid server response.');
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logoutLocal = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Server logout failed, clearing local session anyway:', err);
    } finally {
      logoutLocal();
      setLoading(false);
    }
  };

  const registerCustomer = async (data) => {
    setLoading(true);
    try {
      const res = await authApi.registerCustomer(data);
      setLoading(false);
      return res;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const registerProvider = async (data) => {
    setLoading(true);
    try {
      const res = await authApi.registerProvider(data);
      setLoading(false);
      return res;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    role: user?.role || null,
    loading,
    login,
    logout,
    registerCustomer,
    registerProvider,
    refreshUser: async () => {
      try {
        const res = await authApi.getMe();
        if (res?.success && res?.data) {
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          const updatedUser = {
            ...storedUser,
            id: res.data.userId,
            role: res.data.role,
          };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch (err) {
        console.error('Failed to refresh user info:', err);
      }
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
