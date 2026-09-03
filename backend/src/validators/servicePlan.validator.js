const Joi = require('joi');

const createServicePlanSchema = Joi.object({
  frequency: Joi.string()
    .valid('daily', 'weekly', 'monthly', 'custom')
    .required(),

  price: Joi.number()
    .min(0)
    .precision(2)
    .optional(),

  min_quantity: Joi.number()
    .positive()
    .precision(2)
    .default(1),

  billing_cycle_days: Joi.number()
    .integer()
    .positive()
    .required(),

  deliveries_per_day: Joi.number()
    .integer()
    .min(1)
    .default(1),

  discount_percent: Joi.number()
    .min(0)
    .max(100)
    .precision(2)
    .default(0),

  is_active: Joi.boolean()
    .default(true),
});

const updateServicePlanSchema = Joi.object({
  frequency: Joi.string()
    .valid('daily', 'weekly', 'monthly', 'custom'),

  price: Joi.number()
    .min(0)
    .precision(2),

  min_quantity: Joi.number()
    .positive()
    .precision(2),

  billing_cycle_days: Joi.number()
    .integer()
    .positive(),

  deliveries_per_day: Joi.number()
    .integer()
    .min(1),

  discount_percent: Joi.number()
    .min(0)
    .max(100)
    .precision(2),

  is_active: Joi.boolean(),
}).min(1);

module.exports = {
  createServicePlanSchema,
  updateServicePlanSchema,
};