const crypto = require("crypto");
const https = require("https");
const { Op } = require("sequelize");
const { Payment, Order, Customer, Refund, WebhookEvent, AuditLog, SubscriptionPayment, CustomerSubscription, ServicePlan, Notification, sequelize } = require("../models");
const walletService = require("./wallet.service");
const invoiceService = require("./invoice.service");
const commissionService = require("./commission.service");
const notifications = require("./notification.service");
const AppError = require("../utils/AppError");

const razorpayRequest = (method, path, body = null) => new Promise((resolve, reject) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !secret) return reject(new AppError("Payment provider is not configured", 503, "PAYMENT_PROVIDER_NOT_CONFIGURED"));
  const request = https.request({ hostname: "api.razorpay.com", path, method, auth: `${keyId}:${secret}`, headers: { "Content-Type": "application/json" } }, (response) => {
    let raw = "";
    response.on("data", (chunk) => { raw += chunk; });
    response.on("end", () => { let parsed; try { parsed = JSON.parse(raw); } catch { return reject(new AppError("Invalid payment provider response", 502, "PAYMENT_PROVIDER_ERROR")); } if (response.statusCode < 200 || response.statusCode >= 300) return reject(new AppError(parsed.error?.description || "Payment provider request failed", 502, "PAYMENT_PROVIDER_ERROR")); resolve(parsed); });
  });
  request.on("error", () => reject(new AppError("Payment provider is unavailable", 502, "PAYMENT_PROVIDER_ERROR")));
  request.setTimeout(15000, () => request.destroy(new Error("Payment provider timeout")));
  if (body) request.write(JSON.stringify(body));
  request.end();
});
let razorpayRequester = razorpayRequest;
const setRazorpayRequester = (requester) => { razorpayRequester = requester || razorpayRequest; };

const addDays = (value, days) => {
  const result = new Date(`${String(value).slice(0, 10)}T00:00:00+05:30`);
  result.setDate(result.getDate() + Number(days || 1));
  return result.toISOString().slice(0, 10);
};

const notifySubscriptionPayment = async (subscriptionPayment, title, body, transaction) => {
  const customer = await Customer.findByPk(subscriptionPayment.subscription?.customer_id, { attributes: ["user_id"], transaction });
  if (!customer?.user_id) return null;
  return notifications.createOnce({ user_id: customer.user_id, type: "payment_failed", title, body, reference_type: "subscription_payment", reference_id: subscriptionPayment.id, transaction });
};

const finalizeSuccessfulPayment = async (payment, transaction) => {
  if (payment.reference_type === "order") {
    await Order.update({ status: "confirmed", payment_id: payment.id }, { where: { id: payment.reference_id }, transaction });
  } else {
    const subscriptionPayment = await SubscriptionPayment.findByPk(payment.reference_id, { include: [{ model: CustomerSubscription, as: "subscription", include: [{ model: ServicePlan, as: "servicePlan" }] }], transaction, lock: transaction.LOCK.UPDATE });
    if (!subscriptionPayment) throw new AppError("Subscription payment not found", 404, "SUBSCRIPTION_PAYMENT_NOT_FOUND");
    await subscriptionPayment.update({ status: "paid", payment_id: payment.id }, { transaction });
    const cycleDays = subscriptionPayment.subscription?.servicePlan?.billing_cycle_days || 30;
    await subscriptionPayment.subscription.update({ status: "active", next_billing_date: addDays(subscriptionPayment.billing_period_end, cycleDays) }, { transaction });
  }
  const customer = await Customer.findByPk(payment.customer_id, { attributes: ["user_id"], transaction });
  if (customer?.user_id) await notifications.createOnce({ user_id: customer.user_id, type: "payment_successful", title: "Payment successful", body: "Your payment was completed successfully.", reference_type: "payment", reference_id: payment.id, transaction });
  return commissionService.recordEarningForPayment(payment, transaction);
};

const markSubscriptionPaymentFailed = async (payment, transaction) => {
  if (payment.reference_type !== "subscription_payment") return;
  const subscriptionPayment = await SubscriptionPayment.findByPk(payment.reference_id, { include: [{ model: CustomerSubscription, as: "subscription" }], transaction, lock: transaction.LOCK.UPDATE });
  if (!subscriptionPayment) return;
  const nextDueDate = addDays(new Date(), 1);
  await subscriptionPayment.update({ status: "failed", due_date: nextDueDate }, { transaction });
  if (Number(subscriptionPayment.retry_count) >= 3) {
    await subscriptionPayment.subscription.update({ status: "paused" }, { transaction });
    await notifySubscriptionPayment(subscriptionPayment, "Subscription paused after failed renewals", "Your subscription was paused after three failed renewal attempts.", transaction);
  } else {
    await notifySubscriptionPayment(subscriptionPayment, "Subscription payment failed", "Your subscription renewal payment failed. We will retry it automatically.", transaction);
  }
};

const createSubscriptionRetryOrder = async (subscriptionPaymentId) => {
  const attempt = await sequelize.transaction(async (transaction) => {
    const subscriptionPayment = await SubscriptionPayment.findByPk(subscriptionPaymentId, { include: [{ model: CustomerSubscription, as: "subscription" }], transaction, lock: transaction.LOCK.UPDATE });
    if (!subscriptionPayment) throw new AppError("Subscription payment not found", 404, "SUBSCRIPTION_PAYMENT_NOT_FOUND");
    if (subscriptionPayment.status !== "failed" || Number(subscriptionPayment.retry_count) >= 3) return { skipped: true, subscriptionPayment };
    const retryNumber = Number(subscriptionPayment.retry_count) + 1;
    const idempotencyKey = `subscription:${subscriptionPayment.id}:retry:${retryNumber}`;
    const existing = await Payment.findOne({ where: { idempotency_key: idempotencyKey }, transaction, lock: transaction.LOCK.UPDATE });
    if (existing) {
      await subscriptionPayment.update({ status: "retrying", payment_id: existing.id }, { transaction });
      return { payment: existing, subscriptionPayment, retryNumber, existing: true };
    }
    await subscriptionPayment.update({ status: "retrying", retry_count: retryNumber }, { transaction });
    return { subscriptionPayment, retryNumber, idempotencyKey };
  });
  if (attempt.skipped || attempt.existing) return attempt;

  try {
    const razorpayOrder = await razorpayRequester("POST", "/v1/orders", {
      amount: Math.round(Number(attempt.subscriptionPayment.amount) * 100),
      currency: "INR",
      receipt: `subscription-${attempt.subscriptionPayment.id}-retry-${attempt.retryNumber}`,
      notes: { subscription_payment_id: String(attempt.subscriptionPayment.id), retry: String(attempt.retryNumber) },
    });
    return sequelize.transaction(async (transaction) => {
      const payment = await Payment.create({ customer_id: attempt.subscriptionPayment.subscription.customer_id, reference_type: "subscription_payment", reference_id: attempt.subscriptionPayment.id, amount: attempt.subscriptionPayment.amount, razorpay_order_id: razorpayOrder.id, idempotency_key: attempt.idempotencyKey, status: "created", method: "razorpay" }, { transaction });
      await SubscriptionPayment.update({ payment_id: payment.id }, { where: { id: attempt.subscriptionPayment.id }, transaction });
      return { payment, subscriptionPayment: attempt.subscriptionPayment, retryNumber: attempt.retryNumber, retryOrderId: razorpayOrder.id };
    });
  } catch (error) {
    await sequelize.transaction(async (transaction) => {
      const failed = await SubscriptionPayment.findByPk(attempt.subscriptionPayment.id, { include: [{ model: CustomerSubscription, as: "subscription" }], transaction, lock: transaction.LOCK.UPDATE });
      if (failed) {
        await failed.update({ status: "failed", due_date: addDays(new Date(), 1) }, { transaction });
        await notifySubscriptionPayment(failed, "Subscription payment retry failed", "We could not start your renewal payment retry. We will try again tomorrow.", transaction);
      }
    });
    throw error;
  }
};

const create = async (userId, data) => {
  const customer = await Customer.findOne({ where: { user_id: userId } });
  if (!customer) throw new AppError("Customer profile not found", 404, "CUSTOMER_NOT_FOUND");
  const existing = await Payment.findOne({ where: { customer_id: customer.id, idempotency_key: data.idempotency_key } });
  if (existing) return existing;
  if (data.reference_type === "subscription_payment") {
    const subscriptionPayment = await SubscriptionPayment.findOne({ include: [{ model: CustomerSubscription, as: "subscription" }], where: { id: data.reference_id }, });
    if (!subscriptionPayment || subscriptionPayment.subscription.customer_id !== customer.id) throw new AppError("Subscription payment not found", 404, "SUBSCRIPTION_PAYMENT_NOT_FOUND");
    const razorpayOrder = await razorpayRequest("POST", "/v1/orders", { amount: Math.round(Number(subscriptionPayment.amount) * 100), currency: "INR", receipt: `subscription-${subscriptionPayment.id}`, notes: { subscription_payment_id: String(subscriptionPayment.id) } });
    return Payment.create({ customer_id: customer.id, reference_type: data.reference_type, reference_id: subscriptionPayment.id, amount: subscriptionPayment.amount, razorpay_order_id: razorpayOrder.id, idempotency_key: data.idempotency_key, status: "created" });
  }
  if (data.reference_type !== "order") throw new AppError("Unsupported payment reference", 400, "UNSUPPORTED_PAYMENT_REFERENCE");
  const order = await Order.findOne({ where: { id: data.reference_id, customer_id: customer.id } });
  if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
  if (data.payment_method === "wallet") {
    const result = await sequelize.transaction(async (transaction) => {
      const walletResult = await walletService.debitWallet(customer.id, order.total_amount, {
        transaction,
        reference_type: "order",
        reference_id: order.id,
        description: `Payment for order ${order.order_number}`,
      });
      const payment = await Payment.create({ customer_id: customer.id, reference_type: "order", reference_id: order.id, amount: order.total_amount, razorpay_order_id: `wallet_${data.idempotency_key}`, idempotency_key: data.idempotency_key, status: "paid", method: "wallet", paid_at: new Date() }, { transaction });
      await order.update({ payment_id: payment.id }, { transaction });
      await finalizeSuccessfulPayment(payment, transaction);
      return { payment, wallet: walletResult.wallet };
    });
    await invoiceService.createInvoiceForPayment(result.payment.id);
    return result;
  }
  const razorpayOrder = await razorpayRequest("POST", "/v1/orders", { amount: Math.round(Number(order.total_amount) * 100), currency: "INR", receipt: order.order_number, notes: { order_id: String(order.id) } });
  return Payment.create({ customer_id: customer.id, reference_type: data.reference_type, reference_id: order.id, amount: order.total_amount, razorpay_order_id: razorpayOrder.id, idempotency_key: data.idempotency_key, status: "created" });
};

const verify = async (userId, data) => {
  const customer = await Customer.findOne({ where: { user_id: userId } });
  const payment = await Payment.findOne({ where: { customer_id: customer?.id, razorpay_order_id: data.razorpay_order_id } });
  if (!payment) throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new AppError("Payment provider is not configured", 503, "PAYMENT_PROVIDER_NOT_CONFIGURED");
  const expectedBuffer = Buffer.from(crypto.createHmac("sha256", secret).update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`).digest("hex"));
  const supplied = Buffer.from(data.razorpay_signature);
  if (supplied.length !== expectedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, supplied)) throw new AppError("Payment signature is invalid", 400, "INVALID_PAYMENT_SIGNATURE");
  const paidPayment = await sequelize.transaction(async (transaction) => {
    const locked = await Payment.findByPk(payment.id, { transaction, lock: transaction.LOCK.UPDATE });
    if (locked.status === "paid") return locked;
    await locked.update({ razorpay_payment_id: data.razorpay_payment_id, razorpay_signature: data.razorpay_signature, status: "paid", paid_at: new Date() }, { transaction });
    await finalizeSuccessfulPayment(locked, transaction);
    return locked;
  });
  await invoiceService.createInvoiceForPayment(paidPayment.id);
  return paidPayment;
};

const refund = async (userId, paymentId, data) => sequelize.transaction(async (transaction) => {
  const customer = await Customer.findOne({ where: { user_id: userId }, transaction });
  const payment = await Payment.findOne({ where: { id: paymentId, customer_id: customer?.id }, transaction, lock: transaction.LOCK.UPDATE });
  if (!payment) throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");
  if (!["paid", "partially_refunded"].includes(payment.status) || !payment.razorpay_payment_id) throw new AppError("Payment is not eligible for refund", 409, "PAYMENT_NOT_REFUNDABLE");
  const refunded = await Refund.sum("amount", { where: { payment_id: payment.id, status: { [Op.in]: ["requested", "processing", "processed"] } }, transaction });
  const amount = Number(data.amount || Number(payment.amount) - Number(refunded || 0));
  if (amount <= 0 || amount > Number(payment.amount) - Number(refunded || 0)) throw new AppError("Invalid refund amount", 400, "INVALID_REFUND_AMOUNT");
  const providerRefund = await razorpayRequest("POST", `/v1/payments/${payment.razorpay_payment_id}/refund`, { amount: Math.round(amount * 100), notes: { reason: data.reason } });
  const record = await Refund.create({ payment_id: payment.id, amount, reason: data.reason, status: "processed", razorpay_refund_id: providerRefund.id, processed_at: new Date() }, { transaction });
  const totalRefunded = Number(refunded || 0) + amount;
  await payment.update({ status: totalRefunded >= Number(payment.amount) ? "refunded" : "partially_refunded" }, { transaction });
  await commissionService.applyRefundToEarnings(payment.id, amount, transaction);
  if (customer?.user_id) await notifications.createOnce({ user_id: customer.user_id, type: "refund_processed", title: "Refund processed", body: "Your refund has been processed.", reference_type: "refund", reference_id: record.id, transaction });
  return record;
});

const adminRefund = async (adminUserId, paymentId, data) => sequelize.transaction(async (transaction) => {
  const payment = await Payment.findByPk(paymentId, { transaction, lock: transaction.LOCK.UPDATE });
  if (!payment) throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");
  if (!["paid", "partially_refunded"].includes(payment.status) || !payment.razorpay_payment_id) throw new AppError("Payment is not eligible for refund", 409, "PAYMENT_NOT_REFUNDABLE");
  const refunded = Number(await Refund.sum("amount", { where: { payment_id: payment.id, status: { [Op.in]: ["requested", "processing", "processed"] } }, transaction }) || 0);
  const amount = Number(data.amount || Number(payment.amount) - refunded);
  if (amount <= 0 || amount > Number(payment.amount) - refunded) throw new AppError("Invalid refund amount", 400, "INVALID_REFUND_AMOUNT");
  const providerRefund = await razorpayRequest("POST", `/v1/payments/${payment.razorpay_payment_id}/refund`, { amount: Math.round(amount * 100), notes: { reason: data.reason } });
  const record = await Refund.create({ payment_id: payment.id, amount, reason: data.reason, status: "processed", razorpay_refund_id: providerRefund.id, processed_at: new Date() }, { transaction });
  await payment.update({ status: refunded + amount >= Number(payment.amount) ? "refunded" : "partially_refunded" }, { transaction });
  await commissionService.applyRefundToEarnings(payment.id, amount, transaction);
  await AuditLog.create({ user_id: adminUserId, action: "admin_refund", entity_type: "refund", entity_id: record.id, new_values_json: record.toJSON() }, { transaction });
  const customer = await Customer.findByPk(payment.customer_id, { attributes: ["user_id"], transaction });
  if (customer?.user_id) await notifications.createOnce({ user_id: customer.user_id, type: "refund_processed", title: "Refund processed", body: "Your refund has been processed.", reference_type: "refund", reference_id: record.id, transaction });
  return record;
});

const webhook = async (rawBody, signature, eventId) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new AppError("Payment webhook is not configured", 503, "WEBHOOK_NOT_CONFIGURED");
  const expectedBuffer = Buffer.from(crypto.createHmac("sha256", secret).update(rawBody).digest("hex"));
  const supplied = Buffer.from(signature || "");
  if (supplied.length !== expectedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, supplied)) throw new AppError("Webhook signature is invalid", 401, "INVALID_WEBHOOK_SIGNATURE");
  let payload; try { payload = JSON.parse(rawBody.toString("utf8")); } catch { throw new AppError("Invalid webhook payload", 400, "INVALID_WEBHOOK_PAYLOAD"); }
  const id = eventId || payload.id || crypto.createHash("sha256").update(rawBody).digest("hex");
  return sequelize.transaction(async (transaction) => {
    try { await WebhookEvent.create({ event_id: id, event_type: payload.event, payload_json: payload }, { transaction }); } catch (error) { if (error.name === "SequelizeUniqueConstraintError") return { duplicate: true }; throw error; }
    const paymentId = payload.payload?.payment?.entity?.id;
    const orderId = payload.payload?.payment?.entity?.order_id;
    const refundId = payload.payload?.refund?.entity?.id;
    const payment = await Payment.findOne({ where: paymentId ? { razorpay_payment_id: paymentId } : { razorpay_order_id: orderId }, transaction, lock: transaction.LOCK.UPDATE });
    if (payment && ["payment.captured", "order.paid"].includes(payload.event)) {
      await payment.update({ razorpay_payment_id: paymentId || payment.razorpay_payment_id, status: "paid", paid_at: new Date() }, { transaction });
      await finalizeSuccessfulPayment(payment, transaction);
    }
    if (payment && payload.event === "payment.failed") {
      await payment.update({ status: "failed" }, { transaction });
      await markSubscriptionPaymentFailed(payment, transaction);
    }
    if (refundId) { const refundRecord = await Refund.findOne({ where: { razorpay_refund_id: refundId }, transaction }); if (refundRecord) { await refundRecord.update({ status: payload.event === "refund.failed" ? "failed" : "processed", processed_at: new Date() }, { transaction }); if (payment && payload.event !== "refund.failed") { await payment.update({ status: "refunded" }, { transaction }); await commissionService.applyRefundToEarnings(payment.id, refundRecord.amount, transaction); } } }
    await WebhookEvent.update({ status: "processed", processed_at: new Date() }, { where: { event_id: id }, transaction });
    return { duplicate: false };
  });
};

module.exports = { create, verify, refund, adminRefund, webhook, razorpayRequest, setRazorpayRequester, createSubscriptionRetryOrder, finalizeSuccessfulPayment, markSubscriptionPaymentFailed };
