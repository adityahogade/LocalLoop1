const crypto = require("crypto");
const AppError = require("../../utils/AppError");

class RazorpayPaymentProvider {
  constructor(requesterGetter) {
    this.getRequester = requesterGetter;
  }

  async createOrder({ amount, currency, receipt, notes }) {
    const requester = this.getRequester();
    return requester("POST", "/v1/orders", { amount, currency, receipt, notes });
  }

  async verifySignature({ orderId, paymentId, signature }) {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new AppError("Payment provider is not configured", 503, "PAYMENT_PROVIDER_NOT_CONFIGURED");
    const expectedBuffer = Buffer.from(crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex"));
    const supplied = Buffer.from(signature);
    if (supplied.length !== expectedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, supplied)) {
      throw new AppError("Payment signature is invalid", 400, "INVALID_PAYMENT_SIGNATURE");
    }
    return true;
  }

  async refundPayment({ paymentId, amount, reason }) {
    const requester = this.getRequester();
    return requester("POST", `/v1/payments/${paymentId}/refund`, { amount, notes: { reason } });
  }
}

module.exports = { RazorpayPaymentProvider };
