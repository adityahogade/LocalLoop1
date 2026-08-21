const express = require("express");

const authController = require("../controllers/auth.controller");
const authenticate = require("../midleware/auth");
const validate = require("../midleware/validate");
const Joi = require("joi");

const {
  registerSchema,
  providerRegisterSchema,
} = require("../validators/auth.validator");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Customer Registration
|--------------------------------------------------------------------------
|
| POST /api/auth/register
|
| Public endpoint - no JWT required.
|
*/
router.post(
  "/register",
  validate(registerSchema),
  authController.register
);

/*
|--------------------------------------------------------------------------
| Provider Registration
|--------------------------------------------------------------------------
|
| POST /api/auth/provider-register
|
| Public endpoint - no JWT required.
|
*/
router.post(
  "/provider-register",
  validate(providerRegisterSchema),
  authController.providerRegister
);

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
|
| POST /api/auth/login
|
| Public endpoint - no JWT required.
|
*/
router.post(
  "/login",
  authController.login
);

/*
|--------------------------------------------------------------------------
| Current Authenticated User
|--------------------------------------------------------------------------
|
| GET /api/auth/me
|
| Requires:
| Authorization: Bearer <JWT>
|
*/
router.get(
  "/me",
  authenticate,
  authController.getMe
);
router.post("/refresh", validate(Joi.object({ refresh_token: Joi.string().min(40).required() })), authController.refresh);
router.post("/logout", authenticate, authController.logout);
router.post("/forgot-password", validate(Joi.object({ email: Joi.string().email().required() })), authController.forgotPassword);
router.post("/reset-password", validate(Joi.object({ token: Joi.string().min(40).required(), password: Joi.string().min(8).max(72).required() })), authController.resetPassword);

module.exports = router;