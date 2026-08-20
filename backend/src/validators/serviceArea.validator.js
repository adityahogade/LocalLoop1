const Joi = require('joi');

const pincodeRegex = /^[0-9]{6,10}$/;

const createServiceAreaSchema = Joi.object({
  state: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

  city: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

  area: Joi.string()
    .trim()
    .max(100)
    .allow('', null)
    .optional(),

  pincode: Joi.string()
    .pattern(pincodeRegex)
    .required(),
});

const updateServiceAreaSchema = Joi.object({
  state: Joi.string()
    .trim()
    .min(2)
    .max(100),

  city: Joi.string()
    .trim()
    .min(2)
    .max(100),

  area: Joi.string()
    .trim()
    .max(100)
    .allow('', null),

  pincode: Joi.string()
    .pattern(pincodeRegex),
}).min(1);

module.exports = {
  createServiceAreaSchema,
  updateServiceAreaSchema,
};