const { Review, Customer, Order, Provider, AuditLog } = require("../models");
const AppError = require("../utils/AppError");

const create = async (userId, data) => {
  const customer = await Customer.findOne({ where: { user_id: userId } });
  if (!customer) throw new AppError("Customer profile not found", 404, "CUSTOMER_NOT_FOUND");
  const order = await Order.findOne({ where: { id: data.order_id, customer_id: customer.id, status: "completed" } });
  if (!order) throw new AppError("Only completed orders can be reviewed", 409, "ORDER_NOT_REVIEWABLE");
  const existing = await Review.findOne({ where: { order_id: order.id } });
  if (existing) throw new AppError("This order has already been reviewed", 409, "REVIEW_ALREADY_EXISTS");
  const review = await Review.create({ ...data, customer_id: customer.id, provider_id: order.provider_id, reference_type: "order", reference_id: order.id });
  const aggregate = await Review.findOne({ attributes: [[Review.sequelize.fn("AVG", Review.sequelize.col("rating")), "average"]], where: { provider_id: order.provider_id, is_visible: true }, raw: true });
  await Provider.update({ average_rating: Number(aggregate.average || 0).toFixed(2) }, { where: { id: order.provider_id } });
  return review;
};
const list = async (providerId) => {
  const provider = await Provider.findByPk(providerId);

  if (!provider) {
    throw new AppError("Provider not found", 404, "PROVIDER_NOT_FOUND");
  }

  return Review.findAll({
    where: { provider_id: providerId, is_visible: true },
    order: [["created_at", "DESC"]],
  });
};
const reply = async (userId, reviewId, text) => {
  const provider = await Provider.findOne({ where: { user_id: userId } });
  if (!provider) throw new AppError("Provider profile not found", 404, "PROVIDER_NOT_FOUND");
  const review = await Review.findByPk(reviewId, { attributes: ["id", "provider_id", "provider_reply", "provider_replied_at"] });
  if (!review) throw new AppError("Review not found", 404, "REVIEW_NOT_FOUND");
  if (Number(review.provider_id) !== Number(provider.id)) throw new AppError("Forbidden", 403, "FORBIDDEN");
  await review.update({ provider_reply: text, provider_replied_at: new Date() });
  return review;
};
const moderate = async (adminUserId, reviewId, isVisible) => {
  const review = await Review.findOne({ where: { id: reviewId }, attributes: ["id", "is_visible", "moderation_status"] });
  if (!review) throw new AppError("Review not found", 404, "REVIEW_NOT_FOUND");
  const oldValue = review.is_visible;
  await review.update({ is_visible: isVisible, moderation_status: isVisible ? "visible" : "hidden" });
  await AuditLog.create({ user_id: adminUserId, action: "review.moderated", entity_type: "review", entity_id: review.id, old_values_json: { is_visible: oldValue }, new_values_json: { is_visible: review.is_visible, moderation_status: review.moderation_status } });
  return review;
};
module.exports = { create, list, reply, moderate };
