import apiClient from './api/client';

const unwrapList = (response) => response?.data?.data ?? response?.data ?? [];

export const catalogService = {
  getCategories: async () => {
    const response = await apiClient.get('/catalog/categories');
    return unwrapList(response);
  },

  getServices: async (params = {}) => {
    const response = await apiClient.get('/catalog/services', { params });
    const data = response?.data?.data ?? { items: [], pagination: {} };
    return {
      items: data.items ?? data ?? [],
      pagination: data.pagination ?? {},
    };
  },

  getServiceById: async (id) => {
    const response = await apiClient.get(`/catalog/services/${id}`);
    return response?.data?.data ?? null;
  },

  getProviders: async (params = {}) => {
    const response = await apiClient.get('/catalog/providers', { params });
    return unwrapList(response);
  },
};

export default catalogService;
