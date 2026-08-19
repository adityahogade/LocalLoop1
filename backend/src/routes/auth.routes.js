const express = require("express");

const authController = require("../controllers/auth.controller");
const authenticate = require("../midleware/auth");
const validate = require("../midleware/validate");

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

module.exports = router;