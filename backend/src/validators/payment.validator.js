const Joi = require("joi");

module.exports = {
  createPayment: Joi.object({
    reference_type: Joi.string().valid("order", "subscription_payment").required(),
    reference_id: Joi.number().integer().positive().required(),
    idempotency_key: Joi.string().trim().min(8).max(100).required(),
    payment_method: Joi.string().valid("razorpay", "wallet").default("razorpay"),
  }),
  verifyPayment: Joi.object({
    razorpay_order_id: Joi.string().required(),
    razorpay_payment_id: Joi.string().required(),
    razorpay_signature: Joi.string().required(),
  }),
  refund: Joi.object({
    amount: Joi.number().positive().allow(null),
    reason: Joi.string().trim().min(3).max(255).required(),
  }),
  paymentParams: { params: Joi.object({ paymentId: Joi.number().integer().positive().required() }) },
};
