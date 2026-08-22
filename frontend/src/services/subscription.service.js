import apiClient from './api/client';

const unwrap = (response) => response?.data?.data ?? response?.data ?? [];

export const subscriptionService = {
  list: async () => {
    const response = await apiClient.get('/subscriptions');
    return unwrap(response);
  },

  getById: async (id) => {
    const response = await apiClient.get(`/subscriptions/${id}`);
    return unwrap(response);
  },

  pause: async (id) => {
    const response = await apiClient.post(`/subscriptions/${id}/pause`);
    return unwrap(response);
  },

  resume: async (id) => {
    const response = await apiClient.post(`/subscriptions/${id}/resume`);
    return unwrap(response);
  },

  cancel: async (id) => {
    const response = await apiClient.post(`/subscriptions/${id}/cancel`);
    return unwrap(response);
  },

  skip: async (id, payload) => {
    const response = await apiClient.post(`/subscriptions/${id}/skip`, payload);
    return unwrap(response);
  },

  renew: async (id) => {
    const response = await apiClient.post(`/subscriptions/${id}/renew`);
    return unwrap(response);
  },

  calendar: async (id, from, to) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get(`/subscriptions/${id}/calendar${suffix}`);
    return unwrap(response);
  },
};

export default subscriptionService;
