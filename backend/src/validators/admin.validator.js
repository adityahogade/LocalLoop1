const Joi = require("joi");
const id = Joi.number().integer().positive();
const reportingQuery = Joi.object({ from: Joi.date().iso(), to: Joi.date().iso().min(Joi.ref("from")), status: Joi.string().max(40), page: Joi.number().integer().min(1).default(1), limit: Joi.number().integer().min(1).max(100).default(50), format: Joi.string().valid("json", "csv").default("json") });
module.exports = {
  category: Joi.object({ name: Joi.string().trim().min(2).max(50).required(), slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9-]+$/).max(50).required(), icon_url: Joi.string().uri().max(255).allow(null), is_active: Joi.boolean().default(true) }),
  categoryUpdate: Joi.object({ name: Joi.string().trim().min(2).max(50), slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9-]+$/).max(50), icon_url: Joi.string().uri().max(255).allow(null), is_active: Joi.boolean() }).min(1),
  params: { params: Joi.object({ id: id.required() }) },
  settingUpdate: Joi.object({ value: Joi.any().required(), description: Joi.string().max(255).allow(null, "") }),
  coupon: Joi.object({ code: Joi.string().trim().min(3).max(30).required(), discount_type: Joi.string().valid("percentage", "fixed").required(), discount_value: Joi.number().positive().required(), min_order_amount: Joi.number().min(0), max_discount_amount: Joi.number().positive().allow(null), valid_from: Joi.date().iso().required(), valid_until: Joi.date().iso().greater(Joi.ref("valid_from")).required(), usage_limit: Joi.number().integer().positive().allow(null), per_customer_limit: Joi.number().integer().positive().allow(null), category_id: id.allow(null), is_active: Joi.boolean() }),
  couponUpdate: Joi.object({ discount_type: Joi.string().valid("percentage", "fixed"), discount_value: Joi.number().positive(), min_order_amount: Joi.number().min(0), max_discount_amount: Joi.number().positive().allow(null), valid_from: Joi.date().iso(), valid_until: Joi.date().iso(), usage_limit: Joi.number().integer().positive().allow(null), per_customer_limit: Joi.number().integer().positive().allow(null), category_id: id.allow(null), is_active: Joi.boolean() }).min(1),
  moderation: Joi.object({ is_active: Joi.boolean().required() }),
  commissionRule: Joi.object({ scope: Joi.string().valid("global", "category", "service").required(), category_id: id.allow(null), service_id: id.allow(null), commission_percent: Joi.number().min(0).max(100).required(), effective_from: Joi.date().iso().required(), effective_to: Joi.date().iso().allow(null) }),
  settlementUpdate: Joi.object({ status: Joi.string().valid("requested", "approved", "paid", "rejected"), payout_reference: Joi.string().max(100).allow(null, ""), rejection_reason: Joi.string().max(255).allow(null, "") }).min(1),
  reportingQuery: { query: reportingQuery },
};
