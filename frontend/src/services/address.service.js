import apiClient from './api/client';

const unwrap = (response) => response?.data?.data ?? response?.data ?? [];

export const addressService = {
  list: async () => {
    const response = await apiClient.get('/addresses');
    return unwrap(response);
  },

  create: async (payload) => {
    const response = await apiClient.post('/addresses', payload);
    return response?.data?.data ?? null;
  },

  update: async (id, payload) => {
    const response = await apiClient.patch(`/addresses/${id}`, payload);
    return response?.data?.data ?? null;
  },
};

export default addressService;
