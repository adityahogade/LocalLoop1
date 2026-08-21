const express = require("express");
const controller = require("../controllers/scheduler.controller");
const authenticate = require("../midleware/auth");
const authorize = require("../midleware/authorize");
const validate = require("../midleware/validate");
const Joi = require("joi");
const router = express.Router();
router.post("/run-scheduler", authenticate, authorize(1), validate(Joi.object({ targetDate: Joi.date().iso().allow(null) })), controller.run);
module.exports = router;
