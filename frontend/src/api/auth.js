import axiosClient from './axiosClient';

export const authApi = {
  login: (email, password) => {
    return axiosClient.post('/auth/login', { email, password });
  },
  
  registerCustomer: (data) => {
    return axiosClient.post('/auth/register', {
      full_name: data.fullName || data.full_name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      preferred_language: data.preferredLanguage || data.preferred_language || 'en',
    });
  },

  registerProvider: (data) => {
    return axiosClient.post('/auth/provider-register', {
      full_name: data.fullName || data.full_name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      preferred_language: data.preferredLanguage || data.preferred_language || 'en',
      business_name: data.businessName || data.business_name,
      business_description: data.businessDescription || data.business_description || null,
      logo_url: data.logoUrl || data.logo_url || null,
    });
  },

  getMe: () => {
    return axiosClient.get('/auth/me');
  },

  logout: () => {
    return axiosClient.post('/auth/logout');
  },

  forgotPassword: (email) => {
    return axiosClient.post('/auth/forgot-password', { email });
  },

  resetPassword: (token, password) => {
    return axiosClient.post('/auth/reset-password', { token, password });
  },
};
