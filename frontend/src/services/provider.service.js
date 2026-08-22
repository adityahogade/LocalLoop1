import apiClient from './api/client';

const unwrap = (response) => response?.data?.data ?? response?.data ?? [];

export const providerService = {
  getProfile: async () => {
    const response = await apiClient.get('/providers/me');
    return unwrap(response);
  },

  updateProfile: async (payload) => {
    const response = await apiClient.patch('/providers/me', payload);
    return unwrap(response);
  },

  getServices: async () => {
    const response = await apiClient.get('/v1/provider/services');
    return unwrap(response);
  },

  getServiceById: async (id) => {
    const response = await apiClient.get(`/v1/provider/services/${id}`);
    return unwrap(response);
  },

  createService: async (payload) => {
    const response = await apiClient.post('/v1/provider/services', payload);
    return unwrap(response);
  },

  updateService: async (id, payload) => {
    const response = await apiClient.patch(`/v1/provider/services/${id}`, payload);
    return unwrap(response);
  },

  deleteService: async (id) => {
    const response = await apiClient.delete(`/v1/provider/services/${id}`);
    return unwrap(response);
  },

  getServicePlans: async (serviceId) => {
    const response = await apiClient.get(`/v1/provider/services/${serviceId}/plans`);
    return unwrap(response);
  },

  createServicePlan: async (serviceId, payload) => {
    const response = await apiClient.post(`/v1/provider/services/${serviceId}/plans`, payload);
    return unwrap(response);
  },

  updateServicePlan: async (serviceId, id, payload) => {
    const response = await apiClient.patch(`/v1/provider/services/${serviceId}/plans/${id}`, payload);
    return unwrap(response);
  },

  deleteServicePlan: async (serviceId, id) => {
    const response = await apiClient.delete(`/v1/provider/services/${serviceId}/plans/${id}`);
    return unwrap(response);
  },

  getServiceAreas: async () => {
    const response = await apiClient.get('/v1/provider/service-areas');
    return unwrap(response);
  },

  getAvailability: async () => {
    const response = await apiClient.get('/providers/availability');
    return unwrap(response);
  },

  createAvailability: async (payload) => {
    const response = await apiClient.post('/providers/availability', payload);
    return unwrap(response);
  },

  updateAvailability: async (id, payload) => {
    const response = await apiClient.patch(`/providers/availability/${id}`, payload);
    return unwrap(response);
  },

  deleteAvailability: async (id) => {
    const response = await apiClient.delete(`/providers/availability/${id}`);
    return unwrap(response);
  },

  getOrders: async () => {
    const response = await apiClient.get('/orders');
    return unwrap(response);
  },

  getDeliveries: async () => {
    const response = await apiClient.get('/providers/deliveries');
    return unwrap(response);
  },

  updateDeliveryStatus: async (id, payload) => {
    const response = await apiClient.patch(`/providers/deliveries/${id}/status`, payload);
    return unwrap(response);
  },

  getExpenses: async () => {
    const response = await apiClient.get('/providers/expenses');
    return unwrap(response);
  },

  getAccountingSummary: async (params = {}) => {
    const response = await apiClient.get('/providers/accounting/summary', { params });
    return unwrap(response);
  },

  getAnalytics: async () => {
    const response = await apiClient.get('/providers/accounting/analytics');
    return unwrap(response);
  },

  getSettlements: async () => {
    const response = await apiClient.get('/providers/settlements');
    return unwrap(response);
  },

  createSettlement: async (payload) => {
    const response = await apiClient.post('/providers/settlements', payload);
    return unwrap(response);
  },

  getKycDocuments: async () => {
    const response = await apiClient.get('/providers/kyc');
    return unwrap(response);
  },

  submitKycDocument: async (payload) => {
    const response = await apiClient.post('/providers/kyc', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap(response);
  },

  getBankAccount: async () => {
    const response = await apiClient.get('/providers/bank-account');
    return unwrap(response);
  },

  createBankAccount: async (payload) => {
    const response = await apiClient.post('/providers/bank-account', payload);
    return unwrap(response);
  },

  updateBankAccount: async (payload) => {
    const response = await apiClient.patch('/providers/bank-account', payload);
    return unwrap(response);
  },

  getSupportTickets: async () => {
    const response = await apiClient.get('/support/tickets');
    return unwrap(response);
  },

  createSupportTicket: async (payload) => {
    const response = await apiClient.post('/support/tickets', payload);
    return unwrap(response);
  },
};

export default providerService;
