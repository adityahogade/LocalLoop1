const express = require("express");

const kycController = require("../controllers/kyc.controller");
const authenticate = require("../midleware/auth");
const authorize = require("../midleware/authorize");
const validate = require("../midleware/validate");
const { upload } = require("../midleware/kycUpload");

const {
  createKycDocumentSchema,
} = require("../validators/kyc.validator");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Provider KYC Routes
|--------------------------------------------------------------------------
|
| All routes require:
| 1. JWT authentication
| 2. Provider role (role_id = 3)
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Submit KYC Document
|--------------------------------------------------------------------------
|
| POST /api/providers/kyc
|
*/

router.post(
  "/",
  authenticate,
  authorize(3),
  upload.single("document"),
  validate(createKycDocumentSchema),
  kycController.submitKyc
);

/*
|--------------------------------------------------------------------------
| Get My KYC Documents
|--------------------------------------------------------------------------
|
| GET /api/providers/kyc
|
*/

router.get(
  "/",
  authenticate,
  authorize(3),
  kycController.getMyKycDocuments
);

module.exports = router;