const express = require("express");
const controller = require("../controllers/coupon.controller");
const authenticate = require("../midleware/auth");
const authorize = require("../midleware/authorize");
const validate = require("../midleware/validate");
const Joi = require("joi");

const router = express.Router();
const schema = {
  body: Joi.object({
    code: Joi.string().required(),
    amount: Joi.number().min(0).required(),
    category_id: Joi.number().integer().positive().allow(null),
    order_id: Joi.number().integer().positive().allow(null),
  }),
};

router.use(authenticate, authorize(2));
router.post("/validate", validate(schema), controller.validateCode);
router.post("/apply", validate(schema), controller.apply);
module.exports = router;
