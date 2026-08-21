const Joi = require("joi");
const text = Joi.string().trim().min(1);
module.exports = {
  create: Joi.object({ label: text.max(30).required(), house_no: Joi.string().max(50).allow("", null), building: Joi.string().max(100).allow("", null), street: Joi.string().max(150).allow("", null), area: text.max(100).required(), city: text.max(100).required(), state: text.max(100).required(), pincode: Joi.string().pattern(/^\d{6,10}$/).required(), latitude: Joi.number().min(-90).max(90).allow(null), longitude: Joi.number().min(-180).max(180).allow(null), is_default: Joi.boolean().default(false) }),
  update: Joi.object({ label: text.max(30), house_no: Joi.string().max(50).allow("", null), building: Joi.string().max(100).allow("", null), street: Joi.string().max(150).allow("", null), area: text.max(100), city: text.max(100), state: text.max(100), pincode: Joi.string().pattern(/^\d{6,10}$/), latitude: Joi.number().min(-90).max(90).allow(null), longitude: Joi.number().min(-180).max(180).allow(null), is_default: Joi.boolean() }).min(1),
  params: { params: Joi.object({ id: Joi.number().integer().positive().required() }) },
};
