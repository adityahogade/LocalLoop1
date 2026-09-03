const { Op } = require("sequelize");
const { CommissionRule, ProviderEarning, Order, SubscriptionPayment, CustomerSubscription, ServicePlan, Service } = require("../models");
const AppError = require("../utils/AppError");

const activeRuleWhere = (now = new Date()) => ({
  effective_from: { [Op.lte]: now },
  [Op.or]: [{ effective_to: null }, { effective_to: { [Op.gt]: now } }],
});

const resolveCommissionRule = async ({ serviceId, categoryId, transaction, now = new Date() } = {}) => {
  const models = require("../models");
  if (!models.CommissionRule?.findOne) return null;
  const active = activeRuleWhere(now);
  const scopes = [
    { scope: "service", service_id: serviceId },
    { scope: "category", category_id: categoryId },
    { scope: "global" },
  ];
  for (const where of scopes) {
    const rule = await models.CommissionRule.findOne({
      where: { ...active, ...where },
      order: [["effective_from", "DESC"], ["id", "DESC"]],
      transaction,
    });
    if (rule) return rule;
  }
  return null;
};

const commissionPercentFor = async (context = {}) => {
  const rule = await resolveCommissionRule(context);
  if (rule && rule.commission_percent !== null && rule.commission_percent !== undefined) {
    return { rule, percent: Number(rule.commission_percent) };
  }

  try {
    const { PlatformSetting } = require("../models");
    if (PlatformSetting?.findOne) {
      const setting = await PlatformSetting.findOne({
        where: {
          setting_key: {
            [Op.in]: ["commission_percent", "service_fee_percent", "default_commission_percent"]
          }
        },
        order: [["id", "ASC"]],
        transaction: context?.transaction
      });
      if (setting && setting.setting_value) {
        const val = Number(String(setting.setting_value).replace(/"/g, ''));
        if (!isNaN(val)) {
          return { rule: null, percent: val };
        }
      }
    }
  } catch (err) {
    // fallback
  }

  return { rule: null, percent: 0 };
};

const createProviderEarning = async ({ providerId, sourceType, sourceId, paymentId, grossAmount, providerAmount, serviceId, categoryId, transaction, earningDate = new Date() }) => {
  const existing = await ProviderEarning.findOne({ where: { source_type: sourceType, source_id: sourceId, payment_id: paymentId }, transaction, lock: transaction?.LOCK?.UPDATE });
  if (existing) return existing;
  const { percent } = await commissionPercentFor({ serviceId, categoryId, transaction });
  const gross = Number(grossAmount || 0);

  let net;
  let commission;
  let finalGross = gross;
  if (providerAmount !== undefined && providerAmount !== null) {
    net = Number(providerAmount);
    if (gross <= net && percent > 0) {
      commission = Number((net * (percent / 100)).toFixed(2));
      finalGross = Number((net + commission).toFixed(2));
    } else {
      commission = Number((gross - net).toFixed(2));
    }
  } else {
    commission = Math.round(gross * percent) / 100;
    net = Number((gross - commission).toFixed(2));
  }

  return ProviderEarning.create({
    provider_id: providerId,
    source_type: sourceType,
    source_id: sourceId,
    payment_id: paymentId,
    gross_amount: finalGross,
    commission_rate_applied: percent,
    commission_amount: commission,
    refund_amount: 0,
    net_earning: net,
    earning_date: new Date(earningDate).toISOString().slice(0, 10),
  }, { transaction });
};

const recordEarningForPayment = async (payment, transaction) => {
  if (payment.reference_type === "order") {
    const order = await Order.findByPk(payment.reference_id, { include: [{ model: require("../models").OrderItem, as: "items", include: [{ model: Service, as: "service" }] }], transaction });
    if (!order) throw new AppError("Order not found for payment", 404, "ORDER_NOT_FOUND");
    const service = order.items?.[0]?.service || order.service;
    const providerAmount = Number(order.subtotal || order.total_amount || 0);
    const grossAmount = Number(order.total_amount || payment.amount || 0);
    return createProviderEarning({
      providerId: order.provider_id,
      sourceType: "order",
      sourceId: order.id,
      paymentId: payment.id,
      grossAmount,
      providerAmount,
      serviceId: service?.id,
      categoryId: order.category_id || service?.category_id,
      transaction,
      earningDate: payment.paid_at || new Date()
    });
  }

  const subscriptionPayment = await SubscriptionPayment.findByPk(payment.reference_id, {
    include: [{
      model: CustomerSubscription,
      as: "subscription",
      include: [
        { model: Service, as: "service" },
        { model: ServicePlan, as: "servicePlan" }
      ]
    }],
    transaction
  });

  const subscription = subscriptionPayment?.subscription;
  if (!subscriptionPayment || !subscription) throw new AppError("Subscription payment not found", 404, "SUBSCRIPTION_PAYMENT_NOT_FOUND");

  const quantity = Number(subscription.quantity || 1);
  const planPrice = Number(subscription.servicePlan?.price || subscription.service?.base_price || 0);
  const providerAmount = planPrice * quantity;
  const grossAmount = Number(payment.amount || subscriptionPayment.amount || 0);

  // Find or create the subscription delivery for this billing period
  const { SubscriptionDelivery } = require("../models");
  let delivery = await SubscriptionDelivery.findOne({
    where: { subscription_id: subscription.id },
    order: [["id", "DESC"]],
    transaction
  });

  if (!delivery) {
    delivery = await SubscriptionDelivery.create({
      subscription_id: subscription.id,
      delivery_date: subscriptionPayment.billing_period_start || new Date().toISOString().slice(0, 10),
      status: "delivered",
      quantity: subscription.quantity,
      delivered_at: new Date()
    }, { transaction });
  }

  return createProviderEarning({
    providerId: subscription.provider_id,
    sourceType: "subscription_delivery",
    sourceId: delivery.id,
    paymentId: payment.id,
    grossAmount,
    providerAmount,
    serviceId: subscription.service_id,
    categoryId: subscription.service?.category_id,
    transaction,
    earningDate: payment.paid_at || new Date()
  });
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
