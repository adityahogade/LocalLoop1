const express = require("express");

const providerController = require("../controllers/provider.controller");
const authenticate = require("../midleware/auth");
const authorize = require("../midleware/authorize");
const validate = require("../midleware/validate");

const {
  createProviderSchema,
  updateProviderSchema,
  providerIdSchema,
  providerStatusSchema,
  providerKycSchema,
  updateMyProviderProfileSchema,
} = require("../validators/provider.validator");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Provider Routes
|--------------------------------------------------------------------------
*/

/**
 * Get all providers
 *
 * GET /api/providers
 *
 * Admin only
 */
router.get(
  "/",
  authenticate,
  authorize(1),
  providerController.getAllProviders
);

/*
|--------------------------------------------------------------------------
| Get My Provider Profile
|--------------------------------------------------------------------------
|
| GET /api/providers/me
|
| Provider only
|
*/

router.get(
  "/me",
  authenticate,
  authorize(3),
  providerController.getMyProviderProfile
);

/*
|--------------------------------------------------------------------------
| Update My Provider Profile
|--------------------------------------------------------------------------
|
| PATCH /api/providers/me
|
| Provider only
|
*/

router.patch(
  "/me",
  authenticate,
  authorize(3),
  validate(updateMyProviderProfileSchema),
  providerController.updateMyProviderProfile
);

/**
 * Get provider by ID
 *
 * GET /api/providers/:id
 *
 * Admin only
 */
router.get(
  "/:id",
  authenticate,
  authorize(1),
  validate(providerIdSchema),
  providerController.getProviderById
);

/**
 * Create provider
 *
 * POST /api/providers
 *
 * Admin only
 */
router.post(
  "/",
  authenticate,
  authorize(1),
  validate(createProviderSchema),
  providerController.createProvider
);

/**
 * Update provider
 *
 * PATCH /api/providers/:id
 *
 * Admin only
 */
router.patch(
  "/:id",
  authenticate,
  authorize(1),
  validate(updateProviderSchema),
  providerController.updateProvider
);

/**
 * Update provider active status
 *
 * PATCH /api/providers/:id/status
 *
 * Admin only
 */
router.patch(
  "/:id/status",
  authenticate,
  authorize(1),
  validate(providerStatusSchema),
  providerController.updateProviderStatus
);

/**
 * Update provider KYC
 *
 * PATCH /api/providers/:id/kyc
 *
 * Admin only
 */
router.patch(
  "/:id/kyc",
  authenticate,
  authorize(1),
  validate(providerKycSchema),
  providerController.updateProviderKyc
);

module.exports = router;