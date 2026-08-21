const Joi = require("joi");

module.exports = {
  params: { params: Joi.object({ id: Joi.number().integer().positive().required() }) },
};
