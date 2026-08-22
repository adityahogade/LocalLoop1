import axios from 'axios';
import { clearAuthState, getAccessToken, getRefreshToken, saveSession } from '../../utils/tokenStorage';
import { normalizeApiError } from '../../utils/apiError';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let refreshSubscribers = [];

const notifyRefreshSubscribers = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback) => {
  refreshSubscribers.push(callback);
};

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}, (error) => Promise.reject(normalizeApiError(error)));

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const shouldRetryRefresh =
      error.response?.status === 401 &&
      !originalRequest.__isRetry &&
      !originalRequest.url?.includes('/auth/refresh');

    if (!shouldRetryRefresh) {
      return Promise.reject(normalizeApiError(error));
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        addRefreshSubscriber((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          originalRequest.__isRetry = true;
          apiClient(originalRequest)
            .then(resolve)
            .catch(reject);
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error('REFRESH_TOKEN_MISSING');
      }

      const { data } = await axios.post(
        `${baseURL}/auth/refresh`,
        { refresh_token: refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const nextAccessToken = data?.data?.accessToken || data?.data?.access_token;
      const nextRefreshToken = data?.data?.refreshToken || data?.data?.refresh_token || refreshToken;

      if (!nextAccessToken) {
        throw new Error('INVALID_REFRESH_RESPONSE');
      }

      saveSession({
        accessToken: nextAccessToken,
        refreshToken: nextRefreshToken,
      });

      notifyRefreshSubscribers(nextAccessToken);

      originalRequest.__isRetry = true;
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
      isRefreshing = false;
      return apiClient(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      refreshSubscribers = [];
      clearAuthState();

      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }

      return Promise.reject(normalizeApiError(refreshError));
    }
  }
);

export default apiClient;
