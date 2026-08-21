const { Op } = require("sequelize");
const { CustomerSubscription, SubscriptionDelivery, SkippedDelivery, ServiceArea, Address, Customer, sequelize } = require("../models");
const notifications = require("../services/notification.service");

const dateOnly = (value) => {
  if (value) return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
};

const run = async (targetDate) => {
  const deliveryDate = dateOnly(targetDate);
  const subscriptions = await CustomerSubscription.findAll({
    where: { status: "active", start_date: { [Op.lte]: deliveryDate }, [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: deliveryDate } }] },
    include: [{ model: Address, as: "address" }],
  });
  const summary = { date: deliveryDate, created: 0, existing: 0, skippedVacation: 0, skippedExplicit: 0, areaFlagged: 0, failures: [] };
  for (const subscription of subscriptions) {
    try {
      if (subscription.vacation_start && subscription.vacation_end && deliveryDate >= String(subscription.vacation_start) && deliveryDate <= String(subscription.vacation_end)) { summary.skippedVacation += 1; continue; }
      const explicit = await SkippedDelivery.findOne({ where: { subscription_id: subscription.id, skip_date: deliveryDate } });
      if (explicit) { summary.skippedExplicit += 1; continue; }
      const covered = await ServiceArea.findOne({ where: { provider_id: subscription.provider_id, pincode: subscription.address.pincode } });
      if (!covered) { summary.areaFlagged += 1; continue; }
      await sequelize.transaction(async (transaction) => {
        const [delivery, created] = await SubscriptionDelivery.findOrCreate({ where: { subscription_id: subscription.id, delivery_date: deliveryDate }, defaults: { quantity: subscription.quantity, status: "scheduled" }, transaction });
        if (created) {
          summary.created += 1;
          const customer = await Customer.findByPk(subscription.customer_id, { attributes: ["user_id"], transaction });
          if (customer?.user_id) await notifications.createOnce({ user_id: customer.user_id, type: "delivery_scheduled", title: "Delivery scheduled", body: "Your subscription delivery has been scheduled.", reference_type: "subscription_delivery", reference_id: delivery.id, transaction });
        } else summary.existing += 1;
      });
    } catch (error) { summary.failures.push({ subscription_id: subscription.id, message: error.message }); }
  }
  return summary;
};

module.exports = { run, dateOnly };
