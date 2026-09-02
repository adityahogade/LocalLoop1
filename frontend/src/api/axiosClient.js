import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ;

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach authorization bearer token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add Accept-Language header from localStorage for localized backend validation messages
    const lang = localStorage.getItem('i18nextLng') || 'en';
    config.headers['Accept-Language'] = lang;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Handle token expiry & refresh rotation automatically
axiosClient.interceptors.response.use(
  (response) => {
    return response.data; // Return only response payload directly (conforms to standard ServiceHub wrapper)
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if error is due to expired token (401 status and not a login attempt)
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/login')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        handleLogout();
        return Promise.reject(error);
      }

      try {
        // Create a separate axios call to avoid interceptor loop
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        if (res.data?.success && res.data?.data) {
          const { accessToken, refreshToken: newRefreshToken } = res.data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          axiosClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          processQueue(null, accessToken);
          isRefreshing = false;

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosClient(originalRequest);
        } else {
          isRefreshing = false;
          handleLogout();
          return Promise.reject(error);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        handleLogout();
        return Promise.reject(refreshError);
      }
    }

    // Format uniform error payload structure
    const serverError = error.response?.data?.error || {
      code: 'NETWORK_ERROR',
      message: error.message || 'Network connection issue occurred.',
    };

    return Promise.reject({
      status: error.response?.status || 500,
      ...serverError,
    });
  }
);

function handleLogout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  // Dispatch custom event to trigger React state updates
  window.dispatchEvent(new Event('auth-logout'));
}

export default axiosClient;
