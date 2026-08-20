const Joi = require("joi");

const createExpenseSchema = {
  body: Joi.object({
    category: Joi.string()
      .valid(
        "fuel",
        "ingredients",
        "raw_materials",
        "cleaning_supplies",
        "staff_salary",
        "maintenance",
        "packaging",
        "transportation",
        "other"
      )
      .required(),

    amount: Joi.number()
      .positive()
      .precision(2)
      .required(),

    expense_date: Joi.date()
      .iso()
      .required(),

    description: Joi.string()
      .trim()
      .max(255)
      .allow("", null)
      .default(null),

    receipt_url: Joi.string()
      .trim()
      .uri()
      .max(255)
      .allow("", null)
      .default(null),
  }).required(),
};

const expenseIdSchema = {
  params: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required(),
  }).required(),
};

const updateExpenseSchema = {
  params: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required(),
  }).required(),

  body: Joi.object({
    category: Joi.string()
      .valid(
        "fuel",
        "ingredients",
        "raw_materials",
        "cleaning_supplies",
        "staff_salary",
        "maintenance",
        "packaging",
        "transportation",
        "other"
      ),

    amount: Joi.number()
      .positive()
      .precision(2),

    expense_date: Joi.date()
      .iso(),

    description: Joi.string()
      .trim()
      .max(255)
      .allow("", null),

    receipt_url: Joi.string()
      .trim()
      .uri()
      .max(255)
      .allow("", null),
  })
    .min(1)
    .required(),
};

module.exports = {
  createExpenseSchema,
  expenseIdSchema,
  updateExpenseSchema,
};