const ACCESS_TOKEN_KEY = 'servicehub.accessToken';
const REFRESH_TOKEN_KEY = 'servicehub.refreshToken';

export const saveSession = ({ accessToken, refreshToken }) => {
  if (typeof window === 'undefined') return;

  if (accessToken) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }

  if (refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
};

export const getAccessToken = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const clearAuthState = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
};
