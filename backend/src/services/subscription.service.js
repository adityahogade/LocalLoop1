const { Op } = require("sequelize");
const { sequelize, Customer, Provider, Service, ServicePlan, Address, ServiceArea, CustomerSubscription, SubscriptionPayment, Payment, SubscriptionDelivery, SkippedDelivery, Notification } = require("../models");
const commissionService = require("./commission.service");
const AppError = require("../utils/AppError");
const notifications = require("./notification.service");
const customerFor = async (userId) => { const customer = await Customer.findOne({ where: { user_id: userId } }); if (!customer) throw new AppError("Customer profile not found", 404, "CUSTOMER_NOT_FOUND"); return customer; };
const include = [{ model: Provider, as: "provider", attributes: ["id", "business_name", "average_rating"] }, { model: Service, as: "service", attributes: ["id", "name", "type", "unit"] }, { model: ServicePlan, as: "servicePlan" }, { model: Address, as: "address" }];
const getOwned = async (userId, id) => { const customer = await customerFor(userId); const subscription = await CustomerSubscription.findOne({ where: { id, customer_id: customer.id }, include }); if (!subscription) throw new AppError("Subscription not found", 404, "SUBSCRIPTION_NOT_FOUND"); return subscription; };
const create = async (userId, data) => sequelize.transaction(async (transaction) => { const customer = await customerFor(userId); const provider = await Provider.findOne({ where: { id: data.provider_id, is_active: true }, transaction }); const service = await Service.findOne({ where: { id: data.service_id, provider_id: data.provider_id, is_active: true }, transaction }); const plan = await ServicePlan.findOne({ where: { id: data.service_plan_id, service_id: data.service_id, is_active: true }, transaction }); const address = await Address.findOne({ where: { id: data.address_id, customer_id: customer.id }, transaction }); if (!provider || !service || !plan || !address) throw new AppError("Invalid provider, service, plan, or address", 400, "INVALID_SUBSCRIPTION_REFERENCE"); if (!["subscription", "both"].includes(service.type) || Number(data.quantity) < Number(plan.min_quantity)) throw new AppError("Service plan requirements are not met", 400, "INVALID_SUBSCRIPTION_PLAN"); const area = await ServiceArea.findOne({ where: { provider_id: provider.id, pincode: address.pincode }, transaction }); if (!area) throw new AppError("Provider does not serve this address", 409, "SERVICE_AREA_UNAVAILABLE"); if (data.delivery_time_slot === "custom" && !data.custom_time) throw new AppError("Custom delivery time is required", 400, "CUSTOM_TIME_REQUIRED"); const overlap = await CustomerSubscription.findOne({ where: { customer_id: customer.id, service_id: service.id, status: { [Op.in]: ["active", "paused", "vacation"] }, [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: data.start_date } }] }, transaction }); if (overlap) throw new AppError("An active subscription already exists for this service", 409, "SUBSCRIPTION_OVERLAP"); const subscription = await CustomerSubscription.create({ ...data, customer_id: customer.id }, { transaction }); const cycleDays = Number(plan.billing_cycle_days || 30); const periodEnd = new Date(`${data.start_date}T00:00:00+05:30`); periodEnd.setDate(periodEnd.getDate() + cycleDays - 1); await SubscriptionPayment.create({ subscription_id: subscription.id, billing_period_start: data.start_date, billing_period_end: periodEnd.toISOString().slice(0, 10), amount: Number(plan.price) * Number(data.quantity), status: "pending", due_date: data.next_billing_date, retry_count: 0 }, { transaction }); await notifications.createOnce({ user_id: userId, type: "subscription_created", title: "Subscription created", body: "Your subscription has been created.", reference_type: "subscription", reference_id: subscription.id, transaction }); return CustomerSubscription.findByPk(subscription.id, { include, transaction }); });
const list = async (userId) => { const customer = await customerFor(userId); return CustomerSubscription.findAll({ where: { customer_id: customer.id }, include, order: [["created_at", "DESC"]] }); };
const update = async (userId, id, data) => { const subscription = await getOwned(userId, id); const previousStatus = subscription.status; const allowed = { active: ["paused", "vacation", "cancelled"], paused: ["active", "cancelled"], vacation: ["active", "cancelled"], cancelled: [], expired: [] }; if (!allowed[subscription.status].includes(data.status)) throw new AppError("Invalid subscription status transition", 409, "INVALID_SUBSCRIPTION_TRANSITION"); if (data.status === "vacation" && (!data.vacation_start || !data.vacation_end)) throw new AppError("Vacation dates are required", 400, "VACATION_DATES_REQUIRED"); await subscription.update(data); if (previousStatus === "active" && data.status === "paused") await notifications.createOnce({ user_id: userId, type: "subscription_paused", title: "Subscription paused", body: "Your subscription has been paused.", reference_type: "subscription", reference_id: subscription.id }); if (previousStatus === "paused" && data.status === "active") await notifications.createOnce({ user_id: userId, type: "subscription_resumed", title: "Subscription resumed", body: "Your subscription is active again.", reference_type: "subscription", reference_id: subscription.id }); return subscription; };
const deliveries = async (userId, id) => { const subscription = await getOwned(userId, id); return SubscriptionDelivery.findAll({ where: { subscription_id: subscription.id }, order: [["delivery_date", "ASC"]], include: [{ model: CustomerSubscription, as: "subscription", attributes: [] }] }); };
const skip = async (userId, id, data) => { const subscription = await getOwned(userId, id); if (!["active", "paused", "vacation"].includes(subscription.status)) throw new AppError("Subscription is not active", 409, "SUBSCRIPTION_NOT_ACTIVE"); const delivery = await SubscriptionDelivery.findOne({ where: { subscription_id: subscription.id, delivery_date: data.skip_date } }); if (delivery) await delivery.update({ status: "skipped", notes: data.reason || null }); return SkippedDelivery.create({ subscription_id: subscription.id, ...data }); };
const calendar = async (userId, id, from, to) => {
	const subscription = await getOwned(userId, id);
	const where = { subscription_id: subscription.id };
	if (from || to) where.delivery_date = { ...(from ? { [Op.gte]: from } : {}), ...(to ? { [Op.lte]: to } : {}) };
	const rows = await SubscriptionDelivery.findAll({ where, order: [["delivery_date", "ASC"]] });
	return { subscription_id: subscription.id, start_date: from || subscription.start_date, end_date: to || subscription.end_date, deliveries: rows.map((delivery) => ({ date: delivery.delivery_date, status: delivery.status, quantity: delivery.quantity, delivered_at: delivery.delivered_at, notes: delivery.notes })) };
};
const updateDeliveryStatus = async (providerId, deliveryId, status, notes = null) => sequelize.transaction(async (transaction) => {
	const delivery = await SubscriptionDelivery.findByPk(deliveryId, { include: [{ model: CustomerSubscription, as: "subscription" }], transaction, lock: transaction.LOCK.UPDATE });
	if (!delivery || delivery.subscription.provider_id !== Number(providerId)) throw new AppError("Delivery not found", 404, "DELIVERY_NOT_FOUND");
	const transitions = { scheduled: ["out_for_delivery", "cancelled", "skipped"], out_for_delivery: ["delivered", "cancelled", "skipped"], delivered: [], skipped: [], cancelled: [] };
	if (!transitions[delivery.status]?.includes(status)) throw new AppError("Invalid delivery status transition", 409, "INVALID_DELIVERY_TRANSITION");
	await delivery.update({ status, notes, delivered_at: status === "delivered" ? new Date() : delivery.delivered_at }, { transaction });
	const customer = await Customer.findByPk(delivery.subscription.customer_id, { attributes: ["user_id"], transaction });
	if (customer?.user_id && status === "out_for_delivery") await notifications.createOnce({ user_id: customer.user_id, type: "delivery_out_for_delivery", title: "Delivery is on the way", body: "Your scheduled delivery is out for delivery.", reference_type: "subscription_delivery", reference_id: delivery.id, transaction });
	if (customer?.user_id && status === "delivered") await notifications.createOnce({ user_id: customer.user_id, type: "delivery_completed", title: "Delivery completed", body: "Your scheduled delivery was completed.", reference_type: "subscription_delivery", reference_id: delivery.id, transaction });
	if (status === "delivered") {
		const subscriptionPayment = await SubscriptionPayment.findOne({ where: { subscription_id: delivery.subscription_id, status: "paid" }, order: [["billing_period_start", "DESC"]], transaction });
		if (!subscriptionPayment?.payment_id) throw new AppError("Delivery has no paid subscription payment", 409, "DELIVERY_PAYMENT_REQUIRED");
		const payment = await Payment.findByPk(subscriptionPayment.payment_id, { transaction });
		const plan = await ServicePlan.findByPk(delivery.subscription.service_plan_id, { transaction });
		const service = await Service.findByPk(delivery.subscription.service_id, { attributes: ["category_id"], transaction });
		await commissionService.createProviderEarning({ providerId, sourceType: "subscription_delivery", sourceId: delivery.id, paymentId: payment.id, grossAmount: Number(plan?.price || payment.amount), serviceId: delivery.subscription.service_id, categoryId: service?.category_id, transaction });
	}
	return delivery;
});
const renew = async (userId, id) => sequelize.transaction(async (transaction) => {
  const subscription = await getOwned(userId, id);
  if (!["active", "expired", "cancelled"].includes(subscription.status)) throw new AppError("Subscription is not eligible for renewal", 409, "SUBSCRIPTION_NOT_RENEWABLE");
  const plan = await ServicePlan.findByPk(subscription.service_plan_id, { transaction });
  if (!plan?.is_active) throw new AppError("Subscription plan is not available", 409, "PLAN_NOT_AVAILABLE");
  const pendingRenewal = await SubscriptionPayment.findOne({ where: { subscription_id: subscription.id, status: "pending", billing_period_start: { [Op.ne]: subscription.start_date } }, order: [["billing_period_start", "DESC"]], transaction, lock: transaction.LOCK.UPDATE });
  if (pendingRenewal) return pendingRenewal;
  const latest = await SubscriptionPayment.findOne({ where: { subscription_id: subscription.id }, order: [["billing_period_end", "DESC"]], transaction, lock: transaction.LOCK.UPDATE });
  const start = latest ? new Date(`${latest.billing_period_end}T00:00:00Z`) : new Date();
  start.setUTCDate(start.getUTCDate() + (latest ? 1 : 0));
  const end = new Date(start); end.setUTCDate(end.getUTCDate() + Number(plan.billing_cycle_days) - 1);
  const due = start.toISOString().slice(0, 10);
  const existing = await SubscriptionPayment.findOne({ where: { subscription_id: subscription.id, billing_period_start: due }, transaction });
  if (existing) return existing;
  const payment = await SubscriptionPayment.create({ subscription_id: subscription.id, billing_period_start: due, billing_period_end: end.toISOString().slice(0, 10), amount: Number(plan.price) * Number(subscription.quantity), status: "pending", due_date: due, retry_count: 0 }, { transaction });
  await subscription.update({ next_billing_date: end.toISOString().slice(0, 10) }, { transaction });
  await notifications.createOnce({ user_id: userId, type: "subscription_renewal", title: "Subscription renewal pending", body: "A renewal payment is ready for your subscription.", reference_type: "subscription_payment", reference_id: payment.id, transaction });
  return payment;
});
module.exports = { create, list, getOwned, update, deliveries, skip, calendar, updateDeliveryStatus, renew };
