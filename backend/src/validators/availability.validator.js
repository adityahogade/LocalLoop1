const Joi = require("joi");

const time = Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/);
const id = Joi.number().integer().positive();

module.exports = {
  availability: Joi.object({
    day_of_week: Joi.number().integer().min(0).max(6).required(),
    start_time: time.required(),
    end_time: time.required(),
    slot_duration_minutes: Joi.number().integer().min(15).max(720).default(60),
    max_bookings_per_slot: Joi.number().integer().min(1).max(100).default(1),
    is_available: Joi.boolean().default(true),
  }),
  availabilityUpdate: Joi.object({
    day_of_week: Joi.number().integer().min(0).max(6),
    start_time: time,
    end_time: time,
    slot_duration_minutes: Joi.number().integer().min(15).max(720),
    max_bookings_per_slot: Joi.number().integer().min(1).max(100),
    is_available: Joi.boolean(),
  }).min(1),
  availabilityParams: { params: Joi.object({ id: id.required() }) },
  providerParams: { params: Joi.object({ providerId: id.required() }) },
};
