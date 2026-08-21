const { Op } = require("sequelize");
const { CommissionRule, ProviderEarning, Order, SubscriptionPayment, CustomerSubscription, ServicePlan, Service } = require("../models");
const AppError = require("../utils/AppError");

const activeRuleWhere = (now = new Date()) => ({
  effective_from: { [Op.lte]: now },
  [Op.or]: [{ effective_to: null }, { effective_to: { [Op.gt]: now } }],
});

const resolveCommissionRule = async ({ serviceId, categoryId, transaction, now = new Date() }) => {
  const active = activeRuleWhere(now);
  const scopes = [
    { scope: "service", service_id: serviceId },
    { scope: "category", category_id: categoryId },
    { scope: "global" },
  ];
  for (const where of scopes) {
    const rule = await CommissionRule.findOne({
      where: { ...active, ...where },
      order: [["effective_from", "DESC"], ["id", "DESC"]],
      transaction,
    });
    if (rule) return rule;
  }
  return null;
};

const commissionPercentFor = async (context) => {
  const rule = await resolveCommissionRule(context);
  return { rule, percent: Number(rule?.commission_percent || 0) };
};

const createProviderEarning = async ({ providerId, sourceType, sourceId, paymentId, grossAmount, serviceId, categoryId, transaction, earningDate = new Date() }) => {
  const existing = await ProviderEarning.findOne({ where: { source_type: sourceType, source_id: sourceId, payment_id: paymentId }, transaction, lock: transaction?.LOCK?.UPDATE });
  if (existing) return existing;
  const { percent } = await commissionPercentFor({ serviceId, categoryId, transaction });
  const gross = Number(grossAmount || 0);
  const commission = Math.round(gross * percent) / 100;
  return ProviderEarning.create({
    provider_id: providerId,
    source_type: sourceType,
    source_id: sourceId,
    payment_id: paymentId,
    gross_amount: gross,
    commission_rate_applied: percent,
    commission_amount: commission,
    refund_amount: 0,
    net_earning: gross - commission,
    earning_date: new Date(earningDate).toISOString().slice(0, 10),
  }, { transaction });
};

const recordEarningForPayment = async (payment, transaction) => {
  if (payment.reference_type === "order") {
    const order = await Order.findByPk(payment.reference_id, { include: [{ model: require("../models").OrderItem, as: "items", include: [{ model: Service, as: "service" }] }], transaction });
    if (!order) throw new AppError("Order not found for payment", 404, "ORDER_NOT_FOUND");
    const service = order.items?.[0]?.service || order.service;
    return createProviderEarning({ providerId: order.provider_id, sourceType: "order", sourceId: order.id, paymentId: payment.id, grossAmount: order.subtotal || order.total_amount, serviceId: service?.id, categoryId: order.category_id || service?.category_id, transaction, earningDate: payment.paid_at || new Date() });
  }

  const subscriptionPayment = await SubscriptionPayment.findByPk(payment.reference_id, { include: [{ model: CustomerSubscription, as: "subscription", include: [{ model: Service, as: "service" }, { model: ServicePlan, as: "servicePlan" }] }], transaction });
  const subscription = subscriptionPayment?.subscription;
  if (!subscriptionPayment || !subscription) throw new AppError("Subscription payment not found", 404, "SUBSCRIPTION_PAYMENT_NOT_FOUND");
  return null;
};

const applyRefundToEarnings = async (paymentId, refundAmount, transaction) => {
  const rows = await ProviderEarning.findAll({ where: { payment_id: paymentId }, transaction, lock: transaction?.LOCK?.UPDATE });
  if (!rows.length) return [];
  let remaining = Number(refundAmount || 0);
  for (const earning of rows) {
    const refund = Math.min(remaining, Number(earning.gross_amount) - Number(earning.refund_amount || 0));
    remaining -= refund;
    const net = Number(earning.gross_amount) - Number(earning.commission_amount) - (Number(earning.refund_amount || 0) + refund);
    await earning.update({ refund_amount: Number(earning.refund_amount || 0) + refund, net_earning: net }, { transaction });
    if (remaining <= 0) break;
  }
  return rows;
};

module.exports = { activeRuleWhere, resolveCommissionRule, commissionPercentFor, createProviderEarning, recordEarningForPayment, applyRefundToEarnings };
