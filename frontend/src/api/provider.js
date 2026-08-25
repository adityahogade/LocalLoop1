import axiosClient from './axiosClient';

export const providerApi = {
  // Provider Profile
  getProfile: () => axiosClient.get('/providers/me'),
  updateProfile: (profile) => axiosClient.patch('/providers/me', profile),

  // KYC Upload (Multipart form-data)
  uploadKyc: (formData) => axiosClient.post('/providers/kyc', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getKycDocuments: () => axiosClient.get('/providers/kyc'),

  // Bank Account
  getBankAccount: () => axiosClient.get('/providers/bank-account'),
  createBankAccount: (bank) => axiosClient.post('/providers/bank-account', bank),
  updateBankAccount: (bank) => axiosClient.patch('/providers/bank-account', bank),
  deleteBankAccount: () => axiosClient.delete('/providers/bank-account'),

  // Services & Plans
  getServices: () => axiosClient.get('/v1/provider/services'),
  getService: (id) => axiosClient.get(`/v1/provider/services/${id}`),
  createService: (svc) => axiosClient.post('/v1/provider/services', svc),
  updateService: (id, svc) => axiosClient.patch(`/v1/provider/services/${id}`, svc),
  deleteService: (id) => axiosClient.delete(`/v1/provider/services/${id}`),

  getPlans: (serviceId) => axiosClient.get(`/v1/provider/services/${serviceId}/plans`),
  createPlan: (serviceId, plan) => axiosClient.post(`/v1/provider/services/${serviceId}/plans`, plan),
  updatePlan: (serviceId, id, plan) => axiosClient.patch(`/v1/provider/services/${serviceId}/plans/${id}`, plan),
  deletePlan: (serviceId, id) => axiosClient.delete(`/v1/provider/services/${serviceId}/plans/${id}`),

  // Service Areas
  getServiceAreas: () => axiosClient.get('/v1/provider/service-areas'),
  createServiceArea: (area) => axiosClient.post('/v1/provider/service-areas', area),
  updateServiceArea: (id, area) => axiosClient.patch(`/v1/provider/service-areas/${id}`, area),
  deleteServiceArea: (id) => axiosClient.delete(`/v1/provider/service-areas/${id}`),

  // Availability Slots
  getAvailability: () => axiosClient.get('/providers/availability'),
  createAvailability: (slot) => axiosClient.post('/providers/availability', slot),
  updateAvailability: (id, slot) => axiosClient.patch(`/providers/availability/${id}`, slot),
  deleteAvailability: (id) => axiosClient.delete(`/providers/availability/${id}`),

  // Orders & Deliveries
  getOrders: () => axiosClient.get('/orders'),
  updateOrderStatus: (id, status) => axiosClient.patch(`/orders/${id}/status`, { status }),
  updateDeliveryStatus: (id, status, notes = '') => axiosClient.patch(`/providers/deliveries/${id}/status`, { status, notes }),

  // Expenses
  getExpenses: () => axiosClient.get('/providers/expenses'),
  getExpense: (id) => axiosClient.get(`/providers/expenses/${id}`),
  createExpense: (expense) => axiosClient.post('/providers/expenses', expense),
  updateExpense: (id, expense) => axiosClient.patch(`/providers/expenses/${id}`, expense),
  deleteExpense: (id) => axiosClient.delete(`/providers/expenses/${id}`),

  // Accounting & Analytics
  getAccountingSummary: (params) => axiosClient.get('/providers/accounting/summary', { params }),
  getAccountingAnalytics: (params) => axiosClient.get('/providers/accounting/analytics', { params }),

  // Payout Settlements
  getSettlements: () => axiosClient.get('/providers/settlements'),
  getSettlement: (id) => axiosClient.get(`/providers/settlements/${id}`),
  requestSettlement: (payload) => axiosClient.post('/providers/settlements', payload),

  // Review Reply
  replyToReview: (id, reply) => axiosClient.post(`/reviews/${id}/reply`, { reply }),
};
