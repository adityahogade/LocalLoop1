const Joi = require("joi");
const id = Joi.number().integer().positive();
module.exports = {
  create: Joi.object({ subject: Joi.string().trim().min(3).max(150).required(), category: Joi.string().valid("order", "subscription", "payment", "kyc", "other").required(), priority: Joi.string().valid("low", "medium", "high").default("medium"), message: Joi.string().trim().min(1).max(5000).required() }),
  message: Joi.object({ message: Joi.string().trim().min(1).max(5000).required(), attachment_url: Joi.string().uri().max(255).allow(null) }),
  update: Joi.object({ status: Joi.string().valid("open", "in_progress", "resolved", "closed").required(), priority: Joi.string().valid("low", "medium", "high") }),
  params: { params: Joi.object({ id: id.required() }) },
};
