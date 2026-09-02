const express = require("express");

const router = express.Router();

const controller = require("../controllers/providerSettlement.controller");

const authenticate = require("../midleware/auth");
const authorize = require("../midleware/authorize");
const validate = require("../midleware/validate");

const {
  createSettlementSchema,
} = require("../validators/providerSettlement.validator");

/*
|--------------------------------------------------------------------------
| Provider Settlement Routes
|--------------------------------------------------------------------------
|
| Base URL:
|
| /api/providers/settlements
|
| Authentication
|       ↓
| Provider Authorization
|       ↓
| Controller
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

router.use(authenticate);

/*
|--------------------------------------------------------------------------
| Provider Authorization
|--------------------------------------------------------------------------
|
| Role ID 3 = Provider
|
|--------------------------------------------------------------------------
*/

router.use(authorize(3));

/*
|--------------------------------------------------------------------------
| GET /api/providers/settlements
|--------------------------------------------------------------------------
|
| Get all settlements for logged-in provider
|
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  controller.getSettlements
);

router.get(
  "/summary",
  controller.getEarningsSummary
);

/*
|--------------------------------------------------------------------------
| GET /api/providers/settlements/:id
|--------------------------------------------------------------------------
|
| Get one settlement for logged-in provider
|
|--------------------------------------------------------------------------
*/

router.get(
  "/:id",
  controller.getSettlementById
);

/*
|--------------------------------------------------------------------------
| POST /api/providers/settlements
|--------------------------------------------------------------------------
|
| Create/request a new settlement
|
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  validate(createSettlementSchema),
  controller.createSettlement
);

module.exports = router;