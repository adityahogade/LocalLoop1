const express = require("express");
const Joi = require("joi");
const controller = require("../controllers/delivery.controller");
const authenticate = require("../midleware/auth");
const authorize = require("../midleware/authorize");
const validate = require("../midleware/validate");

const router = express.Router();
router.patch("/:id/status", authenticate, authorize(3), validate({ params: Joi.object({ id: Joi.number().integer().positive().required() }), body: Joi.object({ status: Joi.string().valid("ready", "out_for_delivery", "delivered", "skipped", "cancelled").required(), notes: Joi.string().max(255).allow(null, ""), otp: Joi.string().max(10).allow(null, "") }) }), controller.updateStatus);
module.exports = router;
