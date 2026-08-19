const Joi = require("joi");

/*
|--------------------------------------------------------------------------
| Create User Validation
|--------------------------------------------------------------------------
*/

const createUserSchema = {
  body: Joi.object({
    role_id: Joi.number()
      .integer()
      .positive()
      .required(),

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
| Update User Validation
|--------------------------------------------------------------------------
*/

const updateUserSchema = {
  body: Joi.object({
    full_name: Joi.string()
      .trim()
      .min(2)
      .max(120),

    email: Joi.string()
      .trim()
      .lowercase()
      .email()
      .max(150),

    phone: Joi.string()
      .trim()
      .pattern(/^[0-9]{10,15}$/),

    preferred_language: Joi.string()
      .valid("en", "hi", "mr"),
  })
    .min(1)
    .required(),

  params: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required(),
  }).required(),
};

/*
|--------------------------------------------------------------------------
| Update User Status Validation
|--------------------------------------------------------------------------
*/

const updateUserStatusSchema = {
  body: Joi.object({
    status: Joi.string()
      .valid("active", "suspended", "deleted")
      .required(),
  }).required(),

  params: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required(),
  }).required(),
};
const userIdSchema = {
  params: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required(),
  }).required(),
};
module.exports = {
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  userIdSchema,
};