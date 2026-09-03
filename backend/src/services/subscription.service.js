const { Op } = require("sequelize");
const { sequelize, Customer, Provider, Service, ServicePlan, Address, ServiceArea, CustomerSubscription, SubscriptionPayment, Payment, SubscriptionDelivery, SkippedDelivery, Notification } = require("../models");
const commissionService = require("./commission.service");
const AppError = require("../utils/AppError");
const notifications = require("./notification.service");
const customerFor = async (userId) => { const customer = await Customer.findOne({ where: { user_id: userId } }); if (!customer) throw new AppError("Customer profile not found", 404, "CUSTOMER_NOT_FOUND"); return customer; };
const include = [{ model: Provider, as: "provider", attributes: ["id", "business_name", "average_rating"] }, { model: Service, as: "service", attributes: ["id", "name", "type", "unit"] }, { model: ServicePlan, as: "servicePlan" }, { model: Address, as: "address" }, { model: SubscriptionPayment, as: "payments" }];
const getOwned = async (userId, id) => {
  const customer = await customerFor(userId);
  const subscription = await CustomerSubscription.findOne({ where: { id }, include });
  if (!subscription) throw new AppError("Subscription not found", 404, "SUBSCRIPTION_NOT_FOUND");
  if (Number(subscription.customer_id) !== Number(customer.id)) throw new AppError("Forbidden", 403, "FORBIDDEN");
  return subscription;
};
const create = async (userId, data) => sequelize.transaction(async (transaction) => { const customer = await customerFor(userId); const provider = await Provider.findOne({ where: { id: data.provider_id, is_active: true }, transaction }); const service = await Service.findOne({ where: { id: data.service_id, provider_id: data.provider_id, is_active: true }, transaction }); const plan = await ServicePlan.findOne({ where: { id: data.service_plan_id, service_id: data.service_id, is_active: true }, transaction }); const address = await Address.findOne({ where: { id: data.address_id, customer_id: customer.id }, transaction }); if (!provider || !service || !plan || !address) throw new AppError("Invalid provider, service, plan, or address", 400, "INVALID_SUBSCRIPTION_REFERENCE"); if (!["subscription", "both"].includes(service.type) || Number(data.quantity) < Number(plan.min_quantity)) throw new AppError("Service plan requirements are not met", 400, "INVALID_SUBSCRIPTION_PLAN");   let isServed = false;
  if (address.latitude !== null && address.longitude !== null && provider.latitude !== null && provider.longitude !== null) {
    const lat1 = parseFloat(address.latitude);
    const lon1 = parseFloat(address.longitude);
    const lat2 = parseFloat(provider.latitude);
    const lon2 = parseFloat(provider.longitude);
    
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    const radius = parseFloat(provider.service_radius_km || 10.00);
    if (distance <= radius) {
      isServed = true;
    } else {
      throw new AppError(`Address is outside the provider's service radius of ${radius} km (distance: ${distance.toFixed(1)} km)`, 409, "SERVICE_AREA_UNAVAILABLE");
    }
  } else {
    const area = await ServiceArea.findOne({ where: { provider_id: provider.id, pincode: address.pincode }, transaction });
    if (area) {
      isServed = true;
    } else {
      throw new AppError("Provider does not serve this address", 409, "SERVICE_AREA_UNAVAILABLE");
    }
  }

  if (data.delivery_time_slot === "custom" && !data.custom_time) throw new AppError("Custom delivery time is required", 400, "CUSTOM_TIME_REQUIRED");
  const overlap = await CustomerSubscription.findOne({ where: { customer_id: customer.id, service_id: service.id, status: { [Op.in]: ["active", "paused", "vacation"] }, [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: data.start_date } }] }, transaction });
  if (overlap) throw new AppError("An active subscription already exists for this service", 409, "SUBSCRIPTION_OVERLAP");

  // Normalize delivery slots
  let normalizedSlots = [];
  if (Array.isArray(data.delivery_slots) && data.delivery_slots.length > 0) {
    normalizedSlots = data.delivery_slots.map((s, idx) => {
      if (typeof s === "string") return { slot: s, custom_time: null, slot_index: idx + 1 };
      return { slot: s.slot || "morning", custom_time: s.custom_time || null, slot_index: idx + 1 };
    });
  } else {
    normalizedSlots = [{
      slot: data.delivery_time_slot || "morning",
      custom_time: data.custom_time || null,
      slot_index: 1
    }];
  }

  const primarySlot = normalizedSlots[0]?.slot || data.delivery_time_slot || "morning";
  const primaryCustomTime = normalizedSlots[0]?.custom_time || data.custom_time || null;

  const subscription = await CustomerSubscription.create({
    ...data,
    delivery_time_slot: primarySlot,
    custom_time: primaryCustomTime,
    delivery_slots: normalizedSlots,
    customer_id: customer.id
  }, { transaction });

  const deliveriesPerDay = Number(plan.deliveries_per_day || 1);
  const cycleDays = Number(plan.billing_cycle_days || 30);
  const discountPercent = Number(plan.discount_percent || 0);
  const basePrice = Number(service.base_price || (plan.price ? Number(plan.price) / (deliveriesPerDay * cycleDays) : 0));
  const quantity = Number(data.quantity || 1);

  // Backend Pricing Formula:
  // grossPrice = basePrice * quantity * deliveriesPerDay * billingCycleDays
  // discountAmount = grossPrice * discountPercent / 100
  // providerAmount = grossPrice - discountAmount
  const grossPrice = basePrice * quantity * deliveriesPerDay * cycleDays;
  const discountAmount = (grossPrice * discountPercent) / 100;
  const providerAmount = Math.max(0, Number((grossPrice - discountAmount).toFixed(2)));

  const startDateObj = new Date(data.start_date);
  const periodEnd = new Date(startDateObj);
  periodEnd.setUTCDate(startDateObj.getUTCDate() + cycleDays - 1);

  const { percent } = await commissionService.commissionPercentFor({
    serviceId: service.id,
    categoryId: service.category_id,
    transaction
  });
  const commissionAmount = Math.round(providerAmount * percent) / 100;
  const customerAmount = Number((providerAmount + commissionAmount).toFixed(2));

  await SubscriptionPayment.create({
    subscription_id: subscription.id,
    billing_period_start: data.start_date,
    billing_period_end: periodEnd.toISOString().slice(0, 10),
    amount: customerAmount,
    status: "pending",
    due_date: data.next_billing_date,
    retry_count: 0
  }, { transaction });
  await notifications.createOnce({ user_id: userId, type: "subscription_created", title: "Subscription created", body: "Your subscription has been created.", reference_type: "subscription", reference_id: subscription.id, transaction });
  return CustomerSubscription.findByPk(subscription.id, { include, transaction });
});
const ensureDeliveriesForSubscription = async (subscription, transaction) => {
  if (!["active", "vacation", "paused"].includes(subscription.status)) return;
  const { SubscriptionDelivery, ServicePlan } = require("../models");
  const plan = subscription.servicePlan || await ServicePlan.findByPk(subscription.service_plan_id, { transaction });
  const cycleDays = Number(plan?.billing_cycle_days || 30);
  const frequency = (plan?.frequency || "daily").toLowerCase();
  const deliveriesPerDay = Number(plan?.deliveries_per_day || 1);

  // Parse configured delivery slots
  let slots = [];
  if (Array.isArray(subscription.delivery_slots) && subscription.delivery_slots.length > 0) {
    slots = subscription.delivery_slots.map((s, idx) => typeof s === "string" ? { slot: s, slot_index: idx + 1 } : { slot: s.slot || "morning", slot_index: idx + 1 });
  } else {
    slots = [{ slot: subscription.delivery_time_slot || "morning", slot_index: 1 }];
  }

  // Ensure slots count matches deliveriesPerDay
  while (slots.length < deliveriesPerDay) {
    const nextSlot = slots.length === 1 ? "evening" : `slot_${slots.length + 1}`;
    slots.push({ slot: nextSlot, slot_index: slots.length + 1 });
  }

  const startDateStr = subscription.start_date || new Date().toISOString().slice(0, 10);
  const [sy, sm, sd] = startDateStr.split('-').map(Number);
  const startDate = new Date(Date.UTC(sy, sm - 1, sd));
  
  let endDate;
  if (subscription.next_billing_date) {
    const [ny, nm, nd] = subscription.next_billing_date.split('-').map(Number);
    endDate = new Date(Date.UTC(ny, nm - 1, nd));
  } else {
    endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + cycleDays);
  }

  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  const [ty, tm, td] = todayStr.split('-').map(Number);
  const todayDate = new Date(Date.UTC(ty, tm - 1, td));
  const targetEndDate = endDate > todayDate ? endDate : todayDate;

  const curr = new Date(startDate);
  const maxDays = Math.min(Math.max(cycleDays + 30, 60), 120);

  for (let i = 0; i < maxDays; i++) {
    const dStr = curr.toISOString().slice(0, 10);
    
    let shouldDeliver = true;
    if (frequency === "daily" || frequency === "monthly") {
      shouldDeliver = true;
    } else if (frequency === "alternate_days") {
      shouldDeliver = i % 2 === 0;
    } else if (frequency === "weekly") {
      shouldDeliver = i % 7 === 0;
    }

    if (shouldDeliver) {
      for (const slotObj of slots) {
        const slotName = slotObj.slot || "morning";
        const existing = await SubscriptionDelivery.findOne({
          where: {
            subscription_id: subscription.id,
            delivery_date: dStr,
            delivery_slot: slotName
          },
          transaction
        });
        if (!existing) {
          // Also check fallback where delivery_slot was null for old single delivery records
          const existingAny = await SubscriptionDelivery.findOne({
            where: {
              subscription_id: subscription.id,
              delivery_date: dStr,
              delivery_slot: null
            },
            transaction
          });
          if (existingAny && slots.length === 1) {
            await existingAny.update({ delivery_slot: slotName }, { transaction });
          } else if (!existingAny) {
            await SubscriptionDelivery.create({
              subscription_id: subscription.id,
              delivery_date: dStr,
              delivery_slot: slotName,
              status: "scheduled",
              quantity: subscription.quantity || 1,
            }, { transaction });
          }
        }
      }
    }

    curr.setUTCDate(curr.getUTCDate() + 1);
    if (curr >= targetEndDate && curr > todayDate) break;
  }
};

const getDeliveryTracking = async (subscription, transaction, isCustomer = false) => {
  const { SubscriptionDelivery } = require("../models");
  await ensureDeliveriesForSubscription(subscription, transaction);

  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  
  const allDeliveries = await SubscriptionDelivery.findAll({
    where: { subscription_id: subscription.id },
    order: [["delivery_date", "ASC"], ["id", "ASC"]],
    transaction
  });

  const todayDeliveries = allDeliveries.filter(d => d.delivery_date === todayStr);
  const todayDelivery = todayDeliveries[0] || null;
  
  let todayStatus = "NO_DELIVERY";
  if (todayDeliveries.length > 0) {
    if (todayDeliveries.every(d => d.status === "delivered")) {
      todayStatus = "DELIVERED";
    } else if (todayDeliveries.some(d => d.status === "out_for_delivery")) {
      todayStatus = "OUT_FOR_DELIVERY";
    } else if (todayDeliveries.some(d => d.status === "ready")) {
      todayStatus = "READY";
    } else if (todayDeliveries.some(d => d.status === "scheduled")) {
      todayStatus = "SCHEDULED";
    } else {
      todayStatus = todayDeliveries[0].status.toUpperCase();
    }
  }

  const totalDeliveries = allDeliveries.length;
  const completedDeliveries = allDeliveries.filter(d => d.status === "delivered").length;
  const remainingDeliveries = allDeliveries.filter(d => ["scheduled", "ready", "out_for_delivery"].includes(d.status)).length;
  const skippedDeliveries = allDeliveries.filter(d => d.status === "skipped").length;

  let remainingDays = 0;
  if (subscription.next_billing_date) {
    const nextDate = new Date(`${subscription.next_billing_date}T00:00:00+05:30`);
    const todayDate = new Date(`${todayStr}T00:00:00+05:30`);
    const diffMs = nextDate - todayDate;
    remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  const upcomingDeliveries = allDeliveries.filter(d => 
    d.delivery_date >= todayStr && ["scheduled", "ready", "out_for_delivery"].includes(d.status)
  );

  let nextDeliveryDate = null;
  let nextDeliveryLabel = "None";
  if (upcomingDeliveries.length > 0) {
    nextDeliveryDate = upcomingDeliveries[0].delivery_date;
    if (nextDeliveryDate === todayStr) {
      nextDeliveryLabel = "Today";
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(tomorrow);
      if (nextDeliveryDate === tomorrowStr) {
        nextDeliveryLabel = "Tomorrow";
      } else {
        nextDeliveryLabel = new Date(`${nextDeliveryDate}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      }
    }
  }

  const mapDelivery = (d) => ({
    id: d.id,
    delivery_date: d.delivery_date,
    delivery_slot: d.delivery_slot,
    status: d.status,
    quantity: d.quantity,
    delivered_at: d.delivered_at,
    notes: d.notes,
    ...(isCustomer && d.status === "out_for_delivery" ? { delivery_otp: d.otp_code } : {})
  });

  return {
    today_delivery: todayDelivery ? mapDelivery(todayDelivery) : null,
    today_deliveries: todayDeliveries.map(mapDelivery),
    today_delivery_status: todayStatus,
    total_deliveries: totalDeliveries,
    completed_deliveries: completedDeliveries,
    remaining_deliveries: remainingDeliveries,
    skipped_deliveries: skippedDeliveries,
    remaining_days: remainingDays,
    next_delivery_date: nextDeliveryDate,
    next_delivery_label: nextDeliveryLabel,
    deliveries: allDeliveries.map(mapDelivery)
  };
};

const list = async (userId) => {
  const customer = await customerFor(userId);
  const rows = await CustomerSubscription.findAll({
    where: { customer_id: customer.id },
    include,
    order: [["created_at", "DESC"]]
  });

  const result = [];
  for (const sub of rows) {
    const subJson = sub.toJSON();
    if (["active", "paused", "vacation"].includes(sub.status)) {
      subJson.delivery_tracking = await getDeliveryTracking(sub, undefined, true);
    } else {
      subJson.delivery_tracking = {
        today_delivery: null,
        today_delivery_status: "NO_DELIVERY",
        total_deliveries: 0,
        completed_deliveries: 0,
        remaining_deliveries: 0,
        skipped_deliveries: 0,
        remaining_days: 0,
        next_delivery_date: null,
        next_delivery_label: "None",
        deliveries: []
      };
    }
    result.push(subJson);
  }
  return result;
};

const getTodayTracking = async (userId, id) => {
  const subscription = await getOwned(userId, id);
  return getDeliveryTracking(subscription, undefined, true);
};

const update = async (userId, id, data) => sequelize.transaction(async (transaction) => {
  const subscription = await getOwned(userId, id);
  const previousStatus = subscription.status;
  const allowed = { active: ["paused", "vacation", "cancelled"], paused: ["active", "cancelled"], vacation: ["active", "cancelled"], cancelled: [], expired: [] };
  if (!allowed[subscription.status].includes(data.status)) throw new AppError("Invalid subscription status transition", 409, "INVALID_SUBSCRIPTION_TRANSITION");
  
  if (data.status === "vacation") {
    if (!data.vacation_start || !data.vacation_end) throw new AppError("Vacation dates are required", 400, "VACATION_DATES_REQUIRED");
    const vStart = new Date(`${data.vacation_start}T00:00:00+05:30`);
    const vEnd = new Date(`${data.vacation_end}T00:00:00+05:30`);
    const vacationDays = Math.max(1, Math.round((vEnd - vStart) / (1000 * 60 * 60 * 24)) + 1);

    const activeDeliveriesInVacation = await SubscriptionDelivery.findAll({
      where: {
        subscription_id: subscription.id,
        delivery_date: {
          [Op.gte]: data.vacation_start,
          [Op.lte]: data.vacation_end
        },
        status: { [Op.in]: ["scheduled", "ready"] }
      },
      transaction
    });

    for (const deliv of activeDeliveriesInVacation) {
      await deliv.update({ status: "skipped", notes: "Vacation mode" }, { transaction });
    }

    if (subscription.next_billing_date) {
      const currentNext = new Date(`${subscription.next_billing_date}T00:00:00+05:30`);
      currentNext.setDate(currentNext.getDate() + vacationDays);
      data.next_billing_date = currentNext.toISOString().slice(0, 10);
    }
  }

  await subscription.update(data, { transaction });
  if (data.status === "vacation") {
    await ensureDeliveriesForSubscription(subscription, transaction);
  }

  if (previousStatus === "active" && data.status === "paused") await notifications.createOnce({ user_id: userId, type: "subscription_paused", title: "Subscription paused", body: "Your subscription has been paused.", reference_type: "subscription", reference_id: subscription.id, transaction });
  if (previousStatus === "paused" && data.status === "active") await notifications.createOnce({ user_id: userId, type: "subscription_resumed", title: "Subscription resumed", body: "Your subscription is active again.", reference_type: "subscription", reference_id: subscription.id, transaction });
  return subscription;
});

const deliveries = async (userId, id) => { const subscription = await getOwned(userId, id); return SubscriptionDelivery.findAll({ where: { subscription_id: subscription.id }, order: [["delivery_date", "ASC"]], include: [{ model: CustomerSubscription, as: "subscription", attributes: [] }] }); };

const skip = async (userId, id, data) => sequelize.transaction(async (transaction) => {
  const subscription = await getOwned(userId, id);
  if (!["active", "paused", "vacation"].includes(subscription.status)) throw new AppError("Subscription is not active", 409, "SUBSCRIPTION_NOT_ACTIVE");
  const delivery = await SubscriptionDelivery.findOne({ where: { subscription_id: subscription.id, delivery_date: data.skip_date }, transaction });
  if (delivery) {
    await delivery.update({ status: "skipped", notes: data.reason || "Skipped by customer" }, { transaction });
  } else {
    await SubscriptionDelivery.create({
      subscription_id: subscription.id,
      delivery_date: data.skip_date,
      status: "skipped",
      quantity: subscription.quantity || 1,
      notes: data.reason || "Skipped by customer"
    }, { transaction });
  }

  if (subscription.next_billing_date) {
    const currentNext = new Date(`${subscription.next_billing_date}T00:00:00+05:30`);
    currentNext.setDate(currentNext.getDate() + 1);
    const extendedDateStr = currentNext.toISOString().slice(0, 10);
    await subscription.update({ next_billing_date: extendedDateStr }, { transaction });
  }

  await SkippedDelivery.create({ subscription_id: subscription.id, ...data }, { transaction });
  await ensureDeliveriesForSubscription(subscription, transaction);
  return subscription;
});

const calendar = async (userId, id, from, to) => {
	const subscription = await getOwned(userId, id);
	const where = { subscription_id: subscription.id };
	if (from || to) where.delivery_date = { ...(from ? { [Op.gte]: from } : {}), ...(to ? { [Op.lte]: to } : {}) };
	const rows = await SubscriptionDelivery.findAll({ where, order: [["delivery_date", "ASC"]] });
	return { subscription_id: subscription.id, start_date: from || subscription.start_date, end_date: to || subscription.end_date, deliveries: rows.map((delivery) => ({ date: delivery.delivery_date, status: delivery.status, quantity: delivery.quantity, delivered_at: delivery.delivered_at, notes: delivery.notes })) };
};

const updateDeliveryStatus = async (providerId, deliveryId, status, notes = null, otp = null) => sequelize.transaction(async (transaction) => {
	const delivery = await SubscriptionDelivery.findByPk(deliveryId, { include: [{ model: CustomerSubscription, as: "subscription" }], transaction, lock: transaction.LOCK.UPDATE });
	if (!delivery || delivery.subscription.provider_id !== Number(providerId)) throw new AppError("Delivery not found", 404, "DELIVERY_NOT_FOUND");
	const transitions = { scheduled: ["ready", "out_for_delivery", "cancelled", "skipped"], ready: ["out_for_delivery", "cancelled", "skipped"], out_for_delivery: ["delivered", "cancelled", "skipped"], delivered: [], skipped: [], cancelled: [] };
	if (!transitions[delivery.status]?.includes(status)) throw new AppError("Invalid delivery status transition", 409, "INVALID_DELIVERY_TRANSITION");
	
	const updates = { status, notes };

	if (status === "out_for_delivery") {
		if (!delivery.otp_code) {
			updates.otp_code = String(Math.floor(1000 + Math.random() * 9000));
		}
	}

	if (status === "delivered") {
		if (delivery.otp_code) {
			if (!otp || String(otp).trim() !== String(delivery.otp_code).trim()) {
				throw new AppError("Invalid delivery verification OTP. Please ask customer for the correct OTP.", 400, "INVALID_DELIVERY_OTP");
			}
		}
		updates.delivered_at = new Date();
	}

	await delivery.update(updates, { transaction });
	const customer = await Customer.findByPk(delivery.subscription.customer_id, { attributes: ["user_id"], transaction });
	if (customer?.user_id && status === "ready") await notifications.createOnce({ user_id: customer.user_id, type: "delivery_ready", title: "Delivery is prepared", body: "Your scheduled delivery is ready.", reference_type: "subscription_delivery", reference_id: delivery.id, transaction });
	if (customer?.user_id && status === "out_for_delivery") await notifications.createOnce({ user_id: customer.user_id, type: "delivery_out_for_delivery", title: "Delivery is on the way", body: `Your scheduled delivery is out for delivery. OTP: ${updates.otp_code || delivery.otp_code}`, reference_type: "subscription_delivery", reference_id: delivery.id, transaction });
	if (customer?.user_id && status === "delivered") await notifications.createOnce({ user_id: customer.user_id, type: "delivery_completed", title: "Delivery completed", body: "Your scheduled delivery was completed.", reference_type: "subscription_delivery", reference_id: delivery.id, transaction });
	if (status === "delivered") {
		const subscriptionPayment = await SubscriptionPayment.findOne({ where: { subscription_id: delivery.subscription_id, status: "paid" }, order: [["billing_period_start", "DESC"]], transaction });
		if (subscriptionPayment?.payment_id) {
			const payment = await Payment.findByPk(subscriptionPayment.payment_id, { transaction });
			const plan = await ServicePlan.findByPk(delivery.subscription.service_plan_id, { transaction });
			const service = await Service.findByPk(delivery.subscription.service_id, { attributes: ["category_id"], transaction });
			const providerAmount = Number(plan?.price || 0) * Number(delivery.quantity || delivery.subscription.quantity || 1);
			await commissionService.createProviderEarning({ providerId, sourceType: "subscription_delivery", sourceId: delivery.id, paymentId: payment.id, grossAmount: Number(payment.amount), providerAmount, serviceId: delivery.subscription.service_id, categoryId: service?.category_id, transaction });
		}
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
  const service = subscription.service || (Service?.findByPk ? await Service.findByPk(subscription.service_id, { transaction }) : null);
  const deliveriesPerDay = Number(plan.deliveries_per_day || 1);
  const cycleDays = Number(plan.billing_cycle_days || 30);
  const discountPercent = Number(plan.discount_percent || 0);
  const basePrice = Number(service?.base_price || (plan.price ? Number(plan.price) / (deliveriesPerDay * cycleDays) : 0));
  const quantity = Number(subscription.quantity || 1);
  const grossPrice = basePrice * quantity * deliveriesPerDay * cycleDays;
  const discountAmount = (grossPrice * discountPercent) / 100;
  const providerAmount = Math.max(0, Number((grossPrice - discountAmount).toFixed(2)));

  const { percent } = await commissionService.commissionPercentFor({
    serviceId: subscription.service_id,
    categoryId: subscription.service?.category_id,
    transaction
  });
  const commissionAmount = Math.round(providerAmount * percent) / 100;
  const customerAmount = Number((providerAmount + commissionAmount).toFixed(2));
  const payment = await SubscriptionPayment.create({ subscription_id: subscription.id, billing_period_start: due, billing_period_end: end.toISOString().slice(0, 10), amount: customerAmount, status: "pending", due_date: due, retry_count: 0 }, { transaction });
  await subscription.update({ next_billing_date: end.toISOString().slice(0, 10) }, { transaction });
  await notifications.createOnce({ user_id: userId, type: "subscription_renewal", title: "Subscription renewal pending", body: "A renewal payment is ready for your subscription.", reference_type: "subscription_payment", reference_id: payment.id, transaction });
  return payment;
});
module.exports = { create, list, getOwned, update, deliveries, skip, calendar, updateDeliveryStatus, renew, ensureDeliveriesForSubscription, getDeliveryTracking, getTodayTracking };
