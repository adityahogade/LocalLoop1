import apiClient from './api/client';

const unwrap = (response) => response?.data?.data ?? response?.data ?? [];
const unwrapList = (response) => {
  const data = response?.data?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

export const adminService = {
  getStats: async () => {
    const response = await apiClient.get('/admin/stats');
    return unwrap(response);
  },

  getUsers: async () => {
    const response = await apiClient.get('/users');
    return unwrapList(response);
  },

  getUserById: async (id) => {
    const response = await apiClient.get(`/users/${id}`);
    return unwrap(response);
  },

  updateUserStatus: async (id, status) => {
    const response = await apiClient.patch(`/users/${id}/status`, { status });
    return unwrap(response);
  },

  getProviders: async () => {
    const response = await apiClient.get('/providers');
    return unwrapList(response);
  },

  getProviderById: async (id) => {
    const response = await apiClient.get(`/providers/${id}`);
    return unwrap(response);
  },

  updateProviderStatus: async (id, isActive) => {
    const response = await apiClient.patch(`/providers/${id}/status`, { is_active: isActive });
    return unwrap(response);
  },

  updateProviderKyc: async (id, kycStatus, rejectionReason) => {
    const response = await apiClient.patch(`/providers/${id}/kyc`, {
      kyc_status: kycStatus,
      kyc_rejection_reason: rejectionReason || null,
    });
    return unwrap(response);
  },

  getPendingKyc: async () => {
    const response = await apiClient.get('/admin/kyc');
    return unwrapList(response);
  },

  reviewKyc: async (id, status, rejectionReason) => {
    const response = await apiClient.patch(`/admin/kyc/${id}/review`, {
      status,
      rejection_reason: rejectionReason || null,
    });
    return unwrap(response);
  },

  getCategories: async () => {
    const response = await apiClient.get('/admin/categories');
    return unwrapList(response);
  },

  createCategory: async (payload) => {
    const response = await apiClient.post('/admin/categories', payload);
    return unwrap(response);
  },

  updateCategory: async (id, payload) => {
    const response = await apiClient.patch(`/admin/categories/${id}`, payload);
    return unwrap(response);
  },

  deleteCategory: async (id) => {
    const response = await apiClient.delete(`/admin/categories/${id}`);
    return response?.data ?? {};
  },

  getServices: async () => {
    const response = await apiClient.get('/admin/services');
    return unwrapList(response);
  },

  moderateService: async (id, isActive) => {
    const response = await apiClient.patch(`/admin/services/${id}/moderation`, { is_active: isActive });
    return unwrap(response);
  },

  getServiceAreas: async () => {
    const response = await apiClient.get('/admin/service-areas');
    return unwrapList(response);
  },

  updateServiceArea: async (id, payload) => {
    const response = await apiClient.patch(`/admin/service-areas/${id}`, payload);
    return unwrap(response);
  },

  getAdminOrders: async (params = {}) => {
    const response = await apiClient.get('/admin/orders', { params });
    return unwrap(response);
  },

  getAdminSubscriptions: async (params = {}) => {
    const response = await apiClient.get('/admin/subscriptions', { params });
    return unwrap(response);
  },

  getAdminDeliveries: async (params = {}) => {
    const response = await apiClient.get('/admin/deliveries', { params });
    return unwrap(response);
  },

  getCoupons: async () => {
    const response = await apiClient.get('/admin/coupons');
    return unwrapList(response);
  },

  createCoupon: async (payload) => {
    const response = await apiClient.post('/admin/coupons', payload);
    return unwrap(response);
  },

  updateCoupon: async (id, payload) => {
    const response = await apiClient.patch(`/admin/coupons/${id}`, payload);
    return unwrap(response);
  },

  getCommissionRules: async () => {
    const response = await apiClient.get('/admin/commission-rules');
    return unwrapList(response);
  },

  createCommissionRule: async (payload) => {
    const response = await apiClient.post('/admin/commission-rules', payload);
    return unwrap(response);
  },

  updateCommissionRule: async (id, payload) => {
    const response = await apiClient.patch(`/admin/commission-rules/${id}`, payload);
    return unwrap(response);
  },

  getSettlements: async () => {
    const response = await apiClient.get('/admin/settlements');
    return unwrapList(response);
  },

  updateSettlement: async (id, payload) => {
    const response = await apiClient.patch(`/admin/settlements/${id}`, payload);
    return unwrap(response);
  },

  createRefund: async (paymentId, payload) => {
    const response = await apiClient.post(`/admin/refunds/${paymentId}`, payload);
    return unwrap(response);
  },

  getAdminReports: async () => {
    const response = await apiClient.get('/admin/reports');
    return unwrap(response);
  },

  getReports: async () => {
    return adminService.getAdminReports();
  },

  getReportRows: async (family, params = {}) => {
    const response = await apiClient.get(`/admin/reports/${family}`, { params });
    return unwrapList(response);
  },

  getAuditLogs: async () => {
    const response = await apiClient.get('/admin/audit-logs');
    const data = unwrap(response);
    if (data && typeof data === 'object' && Array.isArray(data.rows)) {
      return data.rows;
    }
    return Array.isArray(data) ? data : [];
  },

  getPlatformSettings: async () => {
    const response = await apiClient.get('/admin/settings');
    return unwrapList(response);
  },

  getSettings: async () => {
    return adminService.getPlatformSettings();
  },

  updateSetting: async (key, payload) => {
    const response = await apiClient.patch(`/admin/settings/${key}`, payload);
    return unwrap(response);
  },

  getSettlementDetails: async (id) => {
    const rows = await adminService.getSettlements();
    return (Array.isArray(rows) ? rows : []).find((entry) => String(entry.id) === String(id)) ?? null;
  },

  getSupportTickets: async () => {
    const response = await apiClient.get('/support/tickets');
    return unwrapList(response);
  },

  getSupportTicketById: async (id) => {
    const response = await apiClient.get(`/support/tickets/${id}`);
    return unwrap(response);
  },

  updateSupportTicket: async (id, payload) => {
    const response = await apiClient.patch(`/support/tickets/${id}`, payload);
    return unwrap(response);
  },

  getReviews: async () => {
    return [];
  },

  getReviewsByProvider: async (providerId) => {
    const response = await apiClient.get(`/reviews/${providerId}`);
    return unwrapList(response);
  },

  getRefunds: async () => {
    return [];
  },

  moderateReview: async (id, isVisible) => {
    const response = await apiClient.patch(`/reviews/${id}/moderation`, { is_visible: isVisible });
    return unwrap(response);
  },
};

export default adminService;
