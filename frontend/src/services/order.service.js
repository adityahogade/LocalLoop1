import apiClient from './api/client';

const unwrap = (response) => response?.data?.data ?? response?.data ?? [];

export const orderService = {
  create: async (payload) => {
    const response = await apiClient.post('/orders', payload);
    return unwrap(response);
  },

  list: async () => {
    const response = await apiClient.get('/orders');
    return unwrap(response);
  },

  getById: async (id) => {
    const response = await apiClient.get(`/orders/${id}`);
    return unwrap(response);
  },

  updateStatus: async (id, status) => {
    const response = await apiClient.patch(`/orders/${id}/status`, { status });
    return unwrap(response);
  },
};

export default orderService;
