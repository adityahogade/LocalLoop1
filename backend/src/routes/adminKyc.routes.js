const express = require("express");

const adminKycController = require("../controllers/adminKyc.controller");
const kycController = require("../controllers/kyc.controller");
const authenticate = require("../midleware/auth");
const authorize = require("../midleware/authorize");
const validate = require("../midleware/validate");

const {
  reviewKycSchema,
} = require("../validators/kyc.validator");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Admin KYC Routes
|--------------------------------------------------------------------------
|
| Admin role:
| role_id = 1
|
*/

/*
|--------------------------------------------------------------------------
| Get Pending KYC Documents
|--------------------------------------------------------------------------
|
| GET /api/admin/kyc
|
*/

router.get(
  "/",
  authenticate,
  authorize(1),
  adminKycController.getPendingKyc
);

/*
|--------------------------------------------------------------------------
| View/Download KYC Document
|--------------------------------------------------------------------------
|
| GET /api/admin/kyc/documents/:filename
|
*/

router.get(
  "/documents/:filename",
  authenticate,
  authorize(1),
  kycController.serveKycDocument
);

/*
|--------------------------------------------------------------------------
| Review KYC Document
|--------------------------------------------------------------------------
|
| PATCH /api/admin/kyc/:id/review
|
*/

router.patch(
  "/:id/review",
  authenticate,
  authorize(1),
  validate(reviewKycSchema),
  adminKycController.reviewKyc
);

module.exports = router;