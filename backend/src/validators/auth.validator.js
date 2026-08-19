const Joi = require("joi");

/*
|--------------------------------------------------------------------------
| Customer Registration
|--------------------------------------------------------------------------
*/

const registerSchema = {
  body: Joi.object({
    full_name: Joi.string()
      .trim()
      .min(2)
      .max(120)
      .required(),

    email: Joi.string()
      .trim()
      .lowercase()
      .email()
      .max(150)
      .required(),

    phone: Joi.string()
      .trim()
      .pattern(/^[0-9]{10,15}$/)
      .required(),

    password: Joi.string()
      .min(8)
      .max(72)
      .required(),

    preferred_language: Joi.string()
      .valid("en", "hi", "mr")
      .default("en"),
  }).required(),
};

/*
|--------------------------------------------------------------------------
| Provider Registration
|--------------------------------------------------------------------------
*/

const providerRegisterSchema = {
  body: Joi.object({
    full_name: Joi.string()
      .trim()
      .min(2)
      .max(120)
      .required(),

    email: Joi.string()
      .trim()
      .lowercase()
      .email()
      .max(150)
      .required(),

    phone: Joi.string()
      .trim()
      .pattern(/^[0-9]{10,15}$/)
      .required(),

    password: Joi.string()
      .min(8)
      .max(72)
      .required(),

    preferred_language: Joi.string()
      .valid("en", "hi", "mr")
      .default("en"),

    business_name: Joi.string()
      .trim()
      .min(2)
      .max(150)
      .required(),

    business_description: Joi.string()
      .trim()
      .max(5000)
      .allow("", null)
      .default(null),

    logo_url: Joi.string()
      .trim()
      .uri()
      .max(255)
      .allow("", null)
      .default(null),
  }).required(),
};

module.exports = {
  registerSchema,
  providerRegisterSchema,
};