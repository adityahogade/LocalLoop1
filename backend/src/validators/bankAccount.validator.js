const Joi = require("joi");

/*
|--------------------------------------------------------------------------
| Create Bank Account
|--------------------------------------------------------------------------
*/

const createBankAccountSchema = {
  body: Joi.object({
    account_holder_name: Joi.string()
      .trim()
      .min(2)
      .max(120)
      .required(),

    account_number: Joi.string()
      .trim()
      .pattern(/^[0-9]{6,18}$/)
      .required(),

    ifsc_code: Joi.string()
      .trim()
      .uppercase()
      .pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)
      .required(),

    bank_name: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .required(),
  }).required(),
};

/*
|--------------------------------------------------------------------------
| Update Bank Account
|--------------------------------------------------------------------------
*/

const updateBankAccountSchema = {
  body: Joi.object({
    account_holder_name: Joi.string()
      .trim()
      .min(2)
      .max(120),

    account_number: Joi.string()
      .trim()
      .pattern(/^[0-9]{6,18}$/),

    ifsc_code: Joi.string()
      .trim()
      .uppercase()
      .pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/),

    bank_name: Joi.string()
      .trim()
      .min(2)
      .max(100),
  })
    .min(1)
    .required(),
};

module.exports = {
  createBankAccountSchema,
  updateBankAccountSchema,
};