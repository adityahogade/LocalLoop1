const Joi = require("joi");

const id = Joi.number().integer().positive();
const date = Joi.date().iso().min("now");
const time = Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/);

module.exports = {
  createOrder: Joi.object({
    provider_id: id.required(),
    address_id: id.required(),
    type: Joi.string().valid("cleaning", "water").required(),
    scheduled_date: date.required(),
    scheduled_time: time.required(),
    notes: Joi.string().max(2000).allow("", null),
    items: Joi.array().items(Joi.object({
      service_id: id.required(),
      quantity: Joi.number().positive().max(1000).required(),
      attributes_json: Joi.object().unknown(true).allow(null),
    })).min(1).required(),
  }),
  orderParams: { params: Joi.object({ id: id.required() }) },
  status: Joi.object({ status: Joi.string().valid("confirmed", "in_progress", "completed", "cancelled").required() }),
};
