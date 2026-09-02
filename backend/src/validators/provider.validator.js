const Joi = require("joi");

/*
|--------------------------------------------------------------------------
| Create Provider
|--------------------------------------------------------------------------
*/

const createProviderSchema = {
  body: Joi.object({
    user_id: Joi.number()
      .integer()
      .positive()
      .required(),

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

/*
|--------------------------------------------------------------------------
| Update Provider
|--------------------------------------------------------------------------
*/

const updateProviderSchema = {
  params: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required(),
  }).required(),

  body: Joi.object({
    business_name: Joi.string()
      .trim()
      .min(2)
      .max(150),

    business_description: Joi.string()
      .trim()
      .max(5000)
      .allow("", null),

    logo_url: Joi.string()
      .trim()
      .uri()
      .max(255)
      .allow("", null),
  })
    .min(1)
    .required(),
};

/*
|--------------------------------------------------------------------------
| Provider ID
|--------------------------------------------------------------------------
*/

const providerIdSchema = {
  params: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required(),
  }).required(),
};

/*
|--------------------------------------------------------------------------
| Provider Status
|--------------------------------------------------------------------------
*/

const providerStatusSchema = {
  params: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required(),
  }).required(),

  body: Joi.object({
    is_active: Joi.boolean()
      .required(),
  }).required(),
};

/*
|--------------------------------------------------------------------------
| KYC Status
|--------------------------------------------------------------------------
*/

const providerKycSchema = {
  params: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required(),
  }).required(),

  body: Joi.object({
    kyc_status: Joi.string()
      .valid("pending", "approved", "rejected")
      .required(),

    kyc_rejection_reason: Joi.string()
      .trim()
      .max(255)
      .allow("", null)
      .default(null),
  }).required(),
};

/*
|--------------------------------------------------------------------------
| My Provider Profile Update
|--------------------------------------------------------------------------
*/

const updateMyProviderProfileSchema = {
  body: Joi.object({
    business_name: Joi.string()
      .trim()
      .min(2)
      .max(150),

    business_description: Joi.string()
      .trim()
      .max(5000)
      .allow("", null),

    logo_url: Joi.string()
      .trim()
      .uri()
      .max(255)
      .allow("", null),

    latitude: Joi.number()
      .min(-90)
      .max(90)
      .allow(null),

    longitude: Joi.number()
      .min(-180)
      .max(180)
      .allow(null),

    service_radius_km: Joi.number()
      .greater(0)
      .allow(null),
  })
    .min(1)
    .required(),
};

module.exports = {
  createProviderSchema,
  updateProviderSchema,
  providerIdSchema,
  providerStatusSchema,
  providerKycSchema,
  updateMyProviderProfileSchema,
};