const Joi = require("joi");

module.exports = {
  update: Joi.object({
    full_name: Joi.string().trim().min(2).max(120),
    phone: Joi.string().trim().pattern(/^[0-9]{10,15}$/),
    preferred_language: Joi.string().valid("en", "hi", "mr"),
    date_of_birth: Joi.date().iso().allow(null),
    default_address_id: Joi.number().integer().positive().allow(null),
  }).min(1),
};
