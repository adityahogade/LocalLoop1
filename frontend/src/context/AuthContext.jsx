import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import authService from '../services/auth.service';
import { clearAuthState, getAccessToken, getRefreshToken, saveSession } from '../utils/tokenStorage';

export const AuthContext = createContext(null);

const normalizeUser = (user) => {
  if (!user) return null;

  return {
    ...user,
    role: String(user.role || user.role_name || '').toLowerCase(),
  };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getAccessToken()));
  const [isReady, setIsReady] = useState(false);

  const applySession = (sessionUser) => {
    const normalized = normalizeUser(sessionUser);
    setUser(normalized);
    setIsAuthenticated(Boolean(normalized));
  };

  const refreshSession = async () => {
    const token = getAccessToken();
    if (!token) {
      setIsReady(true);
      setUser(null);
      setIsAuthenticated(false);
      return;
    }

    try {
      const currentUser = await authService.getCurrentUser();
      applySession(currentUser);
    } catch (_error) {
      clearAuthState();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsReady(true);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const login = async ({ email, password }) => {
    const result = await authService.login({ email, password });
    const accessToken = result.accessToken || result.access_token;
    const refreshToken = result.refreshToken || result.refresh_token;

    saveSession({ accessToken, refreshToken });

    const nextUser = normalizeUser(result.user);
    applySession(nextUser || (await authService.getCurrentUser()));
    return result;
  };

  const register = async (payload) => authService.register(payload);

  const logout = async () => {
    try {
      await authService.logout();
    } catch (_error) {
      // Ignore API failures and clear local state.
    } finally {
      clearAuthState();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isReady,
      login,
      register,
      logout,
      refreshToken: getRefreshToken(),
      role: user?.role || null,
    }),
    [user, isAuthenticated, isReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
