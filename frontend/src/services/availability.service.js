import apiClient from './api/client';

export const availabilityService = {
  getSlots: async (providerId, date) => {
    const response = await apiClient.get(`/providers/${providerId}/availability`, {
      params: { date },
    });
    return response?.data?.data ?? [];
  },
};

export default availabilityService;
