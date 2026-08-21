const { Op } = require("sequelize");
const { Coupon, CouponUsage, Customer, Category, Order, AuditLog, sequelize } = require("../models");
const AppError = require("../utils/AppError");

const normalizeDiscount = (coupon, amount) => {
  const orderAmount = Number(amount || 0);
  const value = Number(coupon.discount_value || 0);
  if (coupon.discount_type === "percentage") {
    const computed = (orderAmount * value) / 100;
    const cap = coupon.max_discount_amount ? Number(coupon.max_discount_amount) : null;
    return cap !== null ? Math.min(computed, cap) : computed;
  }
  return Math.min(value, orderAmount);
};

const validateCouponForOrder = async ({ code, customerId, amount, categoryId = null, orderId = null }) => {
  if (!customerId) throw new AppError("Customer profile not found", 404, "CUSTOMER_NOT_FOUND");
  const coupon = await Coupon.findOne({ where: { code: String(code).trim(), is_active: true } });
  if (!coupon) throw new AppError("Coupon not found or inactive", 404, "COUPON_INVALID");

  const now = new Date();
  if (new Date(coupon.valid_from) > now || new Date(coupon.valid_until) < now) {
    throw new AppError("Coupon is not valid for the current date", 400, "COUPON_EXPIRED");
  }

  const orderAmount = Number(amount || 0);
  if (orderAmount < Number(coupon.min_order_amount || 0)) {
    throw new AppError("Order amount does not meet coupon minimum", 400, "COUPON_MIN_AMOUNT");
  }

  if (categoryId && coupon.category_id && Number(coupon.category_id) !== Number(categoryId)) {
    throw new AppError("Coupon is not valid for this category", 400, "COUPON_CATEGORY_INVALID");
  }

  const totalUsage = await CouponUsage.count({ where: { coupon_id: coupon.id } });
  if (coupon.usage_limit && totalUsage >= Number(coupon.usage_limit)) {
    throw new AppError("Coupon usage limit reached", 409, "COUPON_USAGE_LIMIT_REACHED");
  }

  const customerCount = await CouponUsage.count({ where: { coupon_id: coupon.id, customer_id: customerId } });
  if (coupon.per_customer_limit && customerCount >= Number(coupon.per_customer_limit)) {
    throw new AppError("Customer coupon usage limit reached", 409, "COUPON_PER_CUSTOMER_LIMIT_REACHED");
  }

  const discount = normalizeDiscount(coupon, orderAmount);
  return {
    valid: true,
    coupon,
    discount,
    finalAmount: Math.max(orderAmount - discount, 0),
  };
};

const applyCouponToOrder = async ({ code, customerId, amount, categoryId, orderId }) => {
  const result = await sequelize.transaction(async (transaction) => {
    const lockedCoupon = await Coupon.findOne({ where: { code: String(code).trim().toUpperCase(), is_active: true }, transaction, lock: transaction.LOCK.UPDATE });
    if (!lockedCoupon) throw new AppError("Coupon not found or inactive", 404, "COUPON_INVALID");
    const validation = await validateCouponForOrder({ code, customerId, amount, categoryId, orderId });
    const { coupon, discount } = validation;

    if (coupon.usage_limit && Number(coupon.usage_count || 0) >= Number(coupon.usage_limit)) {
      throw new AppError("Coupon usage limit reached", 409, "COUPON_USAGE_LIMIT_REACHED");
    }
    if (orderId) {
      const existingUse = await CouponUsage.findOne({ where: { coupon_id: coupon.id, customer_id: customerId, order_id: orderId }, transaction, lock: transaction.LOCK.UPDATE });
      if (existingUse) throw new AppError("Coupon has already been applied to this order", 409, "COUPON_ALREADY_APPLIED");
    }
    await CouponUsage.create({
      coupon_id: coupon.id,
      customer_id: customerId,
      order_id: orderId || null,
      discount_amount: discount,
      used_at: new Date(),
    }, { transaction });

    return { ...validation, couponId: coupon.id, applied: true };
  });

  return result;
};

const listCoupons = async () => Coupon.findAll({ order: [["created_at", "DESC"]] });

const createCoupon = async (adminUserId, data) => {
  if (!data.code) throw new AppError("Coupon code is required", 400, "COUPON_CODE_REQUIRED");
  const coupon = await Coupon.create({
    code: String(data.code).trim().toUpperCase(),
    discount_type: data.discount_type,
    discount_value: data.discount_value,
    min_order_amount: data.min_order_amount || 0,
    max_discount_amount: data.max_discount_amount || null,
    valid_from: data.valid_from,
    valid_until: data.valid_until,
    usage_limit: data.usage_limit || null,
    per_customer_limit: data.per_customer_limit || null,
    category_id: data.category_id || null,
    is_active: data.is_active !== false,
    created_by: adminUserId,
  });
  await AuditLog.create({ user_id: adminUserId, action: "coupon.created", entity_type: "coupon", entity_id: coupon.id, new_values_json: coupon.toJSON() });
  return coupon;
};

const updateCoupon = async (adminUserId, id, data) => {
  const coupon = await Coupon.findByPk(id);
  if (!coupon) throw new AppError("Coupon not found", 404, "COUPON_NOT_FOUND");
  const oldValues = coupon.toJSON();
  await coupon.update(data);
  await AuditLog.create({ user_id: adminUserId, action: "coupon.updated", entity_type: "coupon", entity_id: coupon.id, old_values_json: oldValues, new_values_json: coupon.toJSON() });
  return coupon;
};

module.exports = {
  validateCouponForOrder,
  applyCouponToOrder,
  listCoupons,
  createCoupon,
  updateCoupon,
  normalizeDiscount,
};
