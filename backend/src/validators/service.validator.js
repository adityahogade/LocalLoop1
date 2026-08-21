const Joi = require("joi");

/*
|--------------------------------------------------------------------------
| Create Service
|--------------------------------------------------------------------------
*/

const createServiceSchema = Joi.object({
  category_id: Joi.number()
    .integer()
    .positive()
    .required(),

  name: Joi.string()
    .trim()
    .min(2)
    .max(150)
    .required(),

  description: Joi.string()
    .allow("")
    .max(5000)
    .optional(),

  type: Joi.string()
    .valid(
      "subscription",
      "one_time",
      "both"
    )
    .required(),

  base_price: Joi.number()
    .precision(2)
    .min(0)
    .required(),

  unit: Joi.string()
    .trim()
    .min(1)
    .max(30)
    .required(),

  attributes_json: Joi.object()
    .optional()
    .allow(null),

  is_active: Joi.boolean()
    .optional(),

  image_url: Joi.string()
    .uri()
    .max(255)
    .allow(null, "")
    .optional(),
});

/*
|--------------------------------------------------------------------------
| Update Service
|--------------------------------------------------------------------------
*/

const updateServiceSchema = Joi.object({
  category_id: Joi.number()
    .integer()
    .positive()
    .optional(),

  name: Joi.string()
    .trim()
    .min(2)
    .max(150)
    .optional(),

  description: Joi.string()
    .allow("")
    .max(5000)
    .optional(),

  type: Joi.string()
    .valid(
      "subscription",
      "one_time",
      "both"
    )
    .optional(),

  base_price: Joi.number()
    .precision(2)
    .min(0)
    .optional(),

  unit: Joi.string()
    .trim()
    .min(1)
    .max(30)
    .optional(),

  attributes_json: Joi.object()
    .allow(null)
    .optional(),

  is_active: Joi.boolean()
    .optional(),

  image_url: Joi.string()
    .uri()
    .max(255)
    .allow(null, "")
    .optional(),
}).min(1);

module.exports = {
  createServiceSchema,
  updateServiceSchema,
};