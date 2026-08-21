const { Op } = require("sequelize");
const { CustomerSubscription, SubscriptionPayment, ServicePlan, Customer, Notification, sequelize } = require("../models");
const paymentService = require("../services/payment.service");

const dateOnly = (value = new Date()) => value instanceof Date ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(value) : String(value).slice(0, 10);
const addDays = (date, days) => { const result = new Date(`${dateOnly(date)}T00:00:00+05:30`); result.setDate(result.getDate() + Number(days)); return dateOnly(result); };

const expireSubscriptions = async (targetDate, transaction) => {
  const [count] = await CustomerSubscription.update({ status: "expired" }, { where: { end_date: { [Op.lt]: targetDate }, status: { [Op.in]: ["active", "vacation"] } }, transaction });
  return count;
};

const ensureRenewalPayment = async (subscription, targetDate) => {
  if (subscription.status !== "active" || String(subscription.next_billing_date) > targetDate) return { status: "not_due", subscription_id: subscription.id };
  const periodStart = dateOnly(subscription.next_billing_date);
  const plan = await ServicePlan.findByPk(subscription.service_plan_id);
  const periodEnd = addDays(periodStart, Number(plan?.billing_cycle_days || 30) - 1);
  const [billingPayment, created] = await SubscriptionPayment.findOrCreate({ where: { subscription_id: subscription.id, billing_period_start: periodStart }, defaults: { billing_period_end: periodEnd, amount: Number(plan?.price || 0) * Number(subscription.quantity), status: "pending", due_date: periodStart, retry_count: 0 } });
  if (billingPayment.payment_id || billingPayment.status === "paid") return { status: "existing", subscription_id: subscription.id, subscriptionPaymentId: billingPayment.id };
  try {
    const customer = await Customer.findByPk(subscription.customer_id, { attributes: ["user_id"] });
    const result = await paymentService.create(customer.user_id, { reference_type: "subscription_payment", reference_id: billingPayment.id, idempotency_key: `subscription:${billingPayment.id}:initial` });
    await billingPayment.update({ payment_id: result.id });
    return { status: created ? "created" : "existing", subscription_id: subscription.id, subscriptionPaymentId: billingPayment.id, paymentId: result.id };
  } catch (error) {
    const customer = await Customer.findByPk(subscription.customer_id, { attributes: ["user_id"] });
    if (customer?.user_id) await require("../services/notification.service").createOnce({ user_id: customer.user_id, type: "payment_failed", title: "Subscription renewal requires payment", body: "Your subscription renewal payment could not be started automatically.", reference_type: "subscription_payment", reference_id: billingPayment.id });
    return { status: "blocked", subscription_id: subscription.id, subscriptionPaymentId: billingPayment.id, message: error.message };
  }
};

const run = async (targetDate = null) => {
  const date = dateOnly(targetDate || new Date());
  const expired = await sequelize.transaction((transaction) => expireSubscriptions(date, transaction));
  const subscriptions = await CustomerSubscription.findAll({ where: { status: "active", next_billing_date: { [Op.lte]: date } } });
  const results = [];
  for (const subscription of subscriptions) {
    try { results.push(await ensureRenewalPayment(subscription, date)); } catch (error) { results.push({ status: "error", subscription_id: subscription.id, message: error.message }); }
  }
  return { date, expired, processed: results.length, results };
};

module.exports = { dateOnly, expireSubscriptions, ensureRenewalPayment, run };
