import axiosClient from './axiosClient';

export const adminApi = {
  // Stats & KPIs
  getStats: () => axiosClient.get('/admin/stats'),

  // Users Management
  getUsers: (params) => axiosClient.get('/users', { params }),
  getUser: (id) => axiosClient.get(`/users/${id}`),
  createUser: (user) => axiosClient.post('/users', user),
  updateUser: (id, data) => axiosClient.patch(`/users/${id}`, data),
  updateUserStatus: (id, status) => axiosClient.patch(`/users/${id}/status`, { status }),
  deleteUser: (id) => axiosClient.delete(`/users/${id}`),

  // Providers Management
  getProviders: () => axiosClient.get('/providers'),
  getProvider: (id) => axiosClient.get(`/providers/${id}`),
  updateProvider: (id, data) => axiosClient.patch(`/providers/${id}`, data),
  updateProviderStatus: (id, is_active) => axiosClient.patch(`/providers/${id}/status`, { is_active }),
  updateProviderKycStatus: (id, kyc_status, kyc_rejection_reason = null) => axiosClient.patch(`/providers/${id}/kyc`, { kyc_status, kyc_rejection_reason }),

  // KYC Approvals
  getPendingKyc: () => axiosClient.get('/admin/kyc'),
  reviewKyc: (id, status, rejection_reason = null) => axiosClient.patch(`/admin/kyc/${id}/review`, { status, rejection_reason }),

  // Categories
  getCategories: () => axiosClient.get('/admin/categories'),
  createCategory: (cat) => axiosClient.post('/admin/categories', cat),
  updateCategory: (id, cat) => axiosClient.patch(`/admin/categories/${id}`, cat),
  deleteCategory: (id) => axiosClient.delete(`/admin/categories/${id}`),

  // Platform Monitoring
  getOrders: (params) => axiosClient.get('/admin/orders', { params }),
  getSubscriptions: (params) => axiosClient.get('/admin/subscriptions', { params }),
  getDeliveries: (params) => axiosClient.get('/admin/deliveries', { params }),
  getServices: () => axiosClient.get('/admin/services'),
  moderateService: (id, is_active) => axiosClient.patch(`/admin/services/${id}/moderation`, { is_active }),
  getServiceAreas: () => axiosClient.get('/admin/service-areas'),
  updateServiceArea: (id, data) => axiosClient.patch(`/admin/service-areas/${id}`, data),

  // Reports
  getReports: () => axiosClient.get('/admin/reports'),
  getReportData: (family, params) => axiosClient.get(`/admin/reports/${family}`, { params }),

  // Commission Rules
  getCommissionRules: () => axiosClient.get('/admin/commission-rules'),
  createCommissionRule: (rule) => axiosClient.post('/admin/commission-rules', rule),
  updateCommissionRule: (id, rule) => axiosClient.patch(`/admin/commission-rules/${id}`, rule),

  // Coupons
  getCoupons: () => axiosClient.get('/admin/coupons'),
  createCoupon: (coupon) => axiosClient.post('/admin/coupons', coupon),
  updateCoupon: (id, coupon) => axiosClient.patch(`/admin/coupons/${id}`, coupon),

  // Payout Settlements
  getSettlements: () => axiosClient.get('/admin/settlements'),
  updateSettlement: (id, data) => axiosClient.patch(`/admin/settlements/${id}`, data), // approve/reject/mark paid

  // Refunds
  refundPayment: (paymentId, amount, reason) => axiosClient.post(`/admin/refunds/${paymentId}`, { amount, reason }),

  // Review Moderation
  moderateReview: (id, is_visible) => axiosClient.patch(`/reviews/${id}/moderation`, { is_visible }),

  // Audit Logs
  getAuditLogs: () => axiosClient.get('/admin/audit-logs'),

  // Platform Settings
  getSettings: () => axiosClient.get('/admin/settings'),
  getSetting: (key) => axiosClient.get(`/admin/settings/${key}`),
  updateSetting: (key, value, description = null) => axiosClient.patch(`/admin/settings/${key}`, { value, description }),

  // Scheduler Recovery Trigger
  runScheduler: (targetDate = null) => axiosClient.post('/v1/subscriptions/run-scheduler', { targetDate }),
};
