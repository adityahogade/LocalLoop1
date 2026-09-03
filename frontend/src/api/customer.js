import axiosClient from './axiosClient';

export const customerApi = {
  // Catalog / Discovery
  getCategories: () => axiosClient.get('/catalog/categories'),
  getServices: (params) => axiosClient.get('/catalog/services', { params }),
  getServiceDetails: (id) => axiosClient.get(`/catalog/services/${id}`),
  getProviders: () => axiosClient.get('/catalog/providers'),
  getProviderAvailability: (providerId, date) => axiosClient.get(`/providers/${providerId}/availability`, { params: { date } }),

  // Addresses
  getAddresses: () => axiosClient.get('/addresses'),
  createAddress: (address) => axiosClient.post('/addresses', address),
  updateAddress: (id, address) => axiosClient.patch(`/addresses/${id}`, address),
  deleteAddress: (id) => axiosClient.delete(`/addresses/${id}`),

  // Subscriptions
  getSubscriptions: () => axiosClient.get('/subscriptions'),
  getSubscription: (id) => axiosClient.get(`/subscriptions/${id}`),
  createSubscription: (sub) => axiosClient.post('/subscriptions', sub),
  updateSubscription: (id, data) => axiosClient.patch(`/subscriptions/${id}`, data),
  pauseSubscription: (id) => axiosClient.post(`/subscriptions/${id}/pause`),
  resumeSubscription: (id) => axiosClient.post(`/subscriptions/${id}/resume`),
  cancelSubscription: (id) => axiosClient.post(`/subscriptions/${id}/cancel`),
  renewSubscription: (id) => axiosClient.post(`/subscriptions/${id}/renew`),
  skipSubscriptionDate: (id, date, reason) => axiosClient.post(`/subscriptions/${id}/skip`, { skip_date: date, reason }),
  setVacationMode: (id, start, end) => axiosClient.post(`/subscriptions/${id}/vacation`, { vacation_start: start, vacation_end: end }),
  getSubscriptionDeliveries: (id) => axiosClient.get(`/subscriptions/${id}/deliveries`),
  getTodayDeliveryTracking: (id) => axiosClient.get(`/subscriptions/${id}/today`),
  getSubscriptionCalendar: (id, from, to) => axiosClient.get(`/subscriptions/${id}/calendar`, { params: { from, to } }),

  // Bookings (One-time orders)
  createOrder: (order) => axiosClient.post('/orders', order),
  getOrders: () => axiosClient.get('/orders'),
  getOrderDetails: (id) => axiosClient.get(`/orders/${id}`),
  cancelOrder: (id) => axiosClient.patch(`/orders/${id}/status`, { status: 'cancelled' }),

  // Payments & Checkout
  createPaymentOrder: (payload) => axiosClient.post('/payments/orders', payload),
  initiatePayment: (payload) => axiosClient.post('/payments/orders', payload),
  verifyPayment: (payload) => axiosClient.post('/payments/verify', payload),

  // Wallet
  getWallet: () => axiosClient.get('/customers/wallet'),
  getWalletTransactions: () => axiosClient.get('/customers/wallet/transactions'),

  // Invoices
  getInvoices: () => axiosClient.get('/invoices'),
  getInvoicePdfUrl: (id) => `${axiosClient.defaults.baseURL}/invoices/${id}/pdf`,
  getInvoicePdfBlob: (id) => axiosClient.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),

  // Reviews
  createReview: (review) => axiosClient.post('/reviews', review),
  getReviewsByProvider: (providerId) => axiosClient.get(`/reviews/${providerId}`),

  // Coupons
  validateCoupon: (payload) => axiosClient.post('/coupons/validate', payload),

  // Notifications
  getNotifications: () => axiosClient.get('/notifications'),
  getUnreadCount: () => axiosClient.get('/notifications/unread-count'),
  markAllNotificationsRead: () => axiosClient.patch('/notifications/read-all'),
  markNotificationRead: (id) => axiosClient.patch(`/notifications/${id}/read`),

  // Support Tickets
  getTickets: () => axiosClient.get('/support/tickets'),
  createTicket: (ticket) => axiosClient.post('/support/tickets', ticket),
  getTicket: (id) => axiosClient.get(`/support/tickets/${id}`),
  sendTicketMessage: (id, message, attachmentUrl = null) => axiosClient.post(`/support/tickets/${id}/messages`, { message, attachment_url: attachmentUrl }),
  closeTicket: (id) => axiosClient.patch(`/support/tickets/${id}`, { status: 'closed' }),

  // Customer Profile
  getMyProfile: () => axiosClient.get('/customers/me'),
  updateMyProfile: (profile) => axiosClient.put('/customers/me', profile),
};
