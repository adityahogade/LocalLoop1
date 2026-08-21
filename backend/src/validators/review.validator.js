const Joi = require("joi");

module.exports = {
  createReview: Joi.object({
    order_id: Joi.number().integer().positive().required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().max(2000).allow("", null),
  }),
  providerParams: { params: Joi.object({ providerId: Joi.number().integer().positive().required() }) },
  params: { params: Joi.object({ id: Joi.number().integer().positive().required() }) },
  reply: Joi.object({ reply: Joi.string().trim().min(1).max(2000).required() }),
  moderation: Joi.object({ is_visible: Joi.boolean().required() }),
};
