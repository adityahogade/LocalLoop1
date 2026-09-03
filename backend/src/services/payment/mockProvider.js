const crypto = require("crypto");

class MockPaymentProvider {
  async createOrder({ amount, currency, receipt, notes }) {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return {
      id: `MOCK_ORDER_${timestamp}_${rand}`,
      amount,
      currency,
      receipt,
      notes
    };
  }

  async verifySignature({ orderId, paymentId, signature }) {
    // Under mock provider, mock signatures are always accepted
    return true;
  }

  async refundPayment({ paymentId, amount, reason }) {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return {
      id: `MOCK_REFUND_${timestamp}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      amount,
      notes: { reason }
    };
  }
}

module.exports = MockPaymentProvider;
