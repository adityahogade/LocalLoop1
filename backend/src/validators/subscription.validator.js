const Joi = require("joi");
const id = Joi.number().integer().positive();
const date = Joi.date().iso();
const time = Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/);
module.exports = {
  create: Joi.object({ provider_id: id.required(), service_id: id.required(), service_plan_id: id.required(), address_id: id.required(), quantity: Joi.number().positive().max(1000).required(), delivery_time_slot: Joi.string().valid("morning", "evening", "custom").required(), custom_time: time.allow(null), start_date: date.required(), end_date: date.allow(null), next_billing_date: date.required() }),
  update: Joi.object({ status: Joi.string().valid("active", "paused", "vacation", "cancelled").required(), vacation_start: date.allow(null), vacation_end: date.allow(null), end_date: date.allow(null), address_id: id }),
  params: { params: Joi.object({ id: id.required() }) },
  skip: Joi.object({ skip_date: date.required(), reason: Joi.string().max(255).allow("", null) }),
  vacation: Joi.object({ vacation_start: date.required(), vacation_end: date.greater(Joi.ref("vacation_start")).required() }),
  calendar: { query: Joi.object({ from: date, to: date }) },
  scheduler: Joi.object({ targetDate: date }),
};
