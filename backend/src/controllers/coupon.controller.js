const couponService = require("../services/coupon.service");
const { Customer } = require("../models");

const customerIdForUser = async (userId) => {
  const customer = await Customer.findOne({ where: { user_id: userId }, attributes: ["id"] });
  return customer?.id;
};

const validateCode = async (req, res, next) => {
  try {
    const customerId = await customerIdForUser(req.user.id);
    const result = await couponService.validateCouponForOrder({
      code: req.body.code,
      customerId,
      amount: req.body.amount,
      categoryId: req.body.category_id || null,
      orderId: req.body.order_id || null,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const apply = async (req, res, next) => {
  try {
    const customerId = await customerIdForUser(req.user.id);
    const result = await couponService.applyCouponToOrder({
      code: req.body.code,
      customerId,
      amount: req.body.amount,
      categoryId: req.body.category_id || null,
      orderId: req.body.order_id || null,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { validateCode, apply };
