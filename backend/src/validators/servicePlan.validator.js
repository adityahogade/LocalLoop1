const Joi = require('joi');

const createServicePlanSchema = Joi.object({
  frequency: Joi.string()
    .valid('daily', 'weekly', 'monthly', 'custom')
    .required(),

  price: Joi.number()
    .positive()
    .precision(2)
    .required(),

  min_quantity: Joi.number()
    .positive()
    .precision(2)
    .default(1),

  billing_cycle_days: Joi.number()
    .integer()
    .positive()
    .required(),

  is_active: Joi.boolean()
    .default(true),
});

const updateServicePlanSchema = Joi.object({
  frequency: Joi.string()
    .valid('daily', 'weekly', 'monthly', 'custom'),

  price: Joi.number()
    .positive()
    .precision(2),

  min_quantity: Joi.number()
    .positive()
    .precision(2),

  billing_cycle_days: Joi.number()
    .integer()
    .positive(),

  is_active: Joi.boolean(),
}).min(1);

module.exports = {
  createServicePlanSchema,
  updateServicePlanSchema,
};