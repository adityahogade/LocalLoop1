const { Op } = require("sequelize");
const { SubscriptionPayment, CustomerSubscription, Notification, Customer, sequelize } = require("../models");
const paymentService = require("./payment.service");
const AppError = require("../utils/AppError");

const MAX_RETRIES = 3;

const ensureNotification = async (customerId, title, body, referenceType = "subscription_payment", referenceId = null) => {
  if (!customerId) return null;
  return Notification.create({
    user_id: (await Customer.findByPk(customerId, { attributes: ["user_id"] }))?.user_id || null,
    type: "payment",
    title,
    body,
    reference_type: referenceType,
    reference_id: referenceId,
  });
};

const retrySubscriptionPayment = async (subscriptionPaymentId) => {
  const payment = await SubscriptionPayment.findByPk(subscriptionPaymentId, { include: [{ model: CustomerSubscription, as: "subscription" }] });
  if (!payment) throw new AppError("Subscription payment not found", 404, "SUBSCRIPTION_PAYMENT_NOT_FOUND");

  const subscription = payment.subscription;
  if (!subscription) throw new AppError("Subscription not found for payment", 404, "SUBSCRIPTION_NOT_FOUND");

  if (payment.status !== "failed") return { status: "skipped", payment, retries: payment.retry_count };

  if (payment.retry_count >= MAX_RETRIES) {
    await payment.update({ status: "failed" });
    await subscription.update({ status: "paused" });
    await ensureNotification(
      subscription.customer_id,
      "Subscription paused after failed renewals",
      `Your subscription has been paused after ${MAX_RETRIES} failed renewal attempts.`,
      "subscription_payment",
      payment.id
    );
    return { status: "paused", payment, retries: payment.retry_count };
  }

  const result = await paymentService.createSubscriptionRetryOrder(payment.id);
  if (result.skipped) return { status: "skipped", payment: result.subscriptionPayment, retries: result.subscriptionPayment.retry_count };
  const nextRetry = result.retryNumber;

  await ensureNotification(
    subscription.customer_id,
    "Subscription renewal retry",
    `A renewal payment retry order has been created. Complete payment to keep your subscription active. Attempt ${nextRetry} of ${MAX_RETRIES}.`,
    "subscription_payment",
    payment.id
  );

  return { status: "retrying", payment: result.payment, retryOrderId: result.retryOrderId, retries: nextRetry };
};

const processFailedRenewals = async (targetDate = null) => {
  const date = targetDate ? new Date(targetDate) : new Date();
  const rows = await SubscriptionPayment.findAll({
    where: {
      status: "failed",
      retry_count: { [Op.lt]: MAX_RETRIES },
      due_date: { [Op.lte]: date },
    },
    include: [{ model: CustomerSubscription, as: "subscription" }],
  });

  const results = [];

  for (const payment of rows) {
    try {
      const result = await retrySubscriptionPayment(payment.id);
      results.push(result);
    } catch (error) {
      results.push({ status: "error", paymentId: payment.id, message: error.message });
    }
  }

  return { processed: rows.length, results };
};

module.exports = {
  MAX_RETRIES,
  processFailedRenewals,
  retrySubscriptionPayment,
};
