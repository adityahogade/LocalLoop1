const { Provider, SubscriptionDelivery } = require("../models");
const subscriptionService = require("../services/subscription.service");

const updateStatus = async (req, res, next) => {
  try {
    const provider = await Provider.findOne({ where: { user_id: req.user.id }, attributes: ["id"] });
    if (!provider) return res.status(404).json({ success: false, error: { code: "PROVIDER_NOT_FOUND", message: "Provider profile not found" } });
    const delivery = await SubscriptionDelivery.findOne({ where: { id: req.params.id }, include: [{ association: "subscription" }] });
    if (!delivery || delivery.subscription.provider_id !== provider.id) return res.status(404).json({ success: false, error: { code: "DELIVERY_NOT_FOUND", message: "Delivery not found" } });
    const result = await subscriptionService.updateDeliveryStatus(provider.id, req.params.id, req.body.status, req.body.notes);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { updateStatus };
