import http from './api/http';

export const authService = {
  login: async ({ email, password }) => {
    const { data } = await http.post('/auth/login', { email, password });
    return data.data;
  },

  register: async (payload) => {
    const { data } = await http.post('/auth/register', payload);
    return data.data;
  },

  providerRegister: async (payload) => {
    const { data } = await http.post('/auth/provider-register', payload);
    return data.data;
  },

  getCurrentUser: async () => {
    const { data } = await http.get('/auth/me');
    return data.data;
  },

  refresh: async (refreshToken) => {
    const { data } = await http.post('/auth/refresh', { refresh_token: refreshToken });
    return data.data;
  },

  forgotPassword: async (email) => {
    const { data } = await http.post('/auth/forgot-password', { email });
    return data.data;
  },

  resetPassword: async ({ token, password }) => {
    const { data } = await http.post('/auth/reset-password', { token, password });
    return data.data;
  },

  logout: async () => {
    await http.post('/auth/logout');
  },
};

export default authService;
