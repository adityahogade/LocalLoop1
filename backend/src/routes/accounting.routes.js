const express = require("express");

const controller = require("../controllers/accounting.controller");

const authenticate = require("../midleware/auth");
const authorize = require("../midleware/authorize");
const validate = require("../midleware/validate");

const {
  accountingSummarySchema,
} = require("../validators/accounting.validator");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Provider Accounting
|--------------------------------------------------------------------------
*/

/*
GET /api/providers/accounting/summary
*/

router.get(
  "/summary",
  authenticate,
  authorize(3),
  validate(accountingSummarySchema),
  controller.getAccountingSummary
);
router.get("/analytics", authenticate, authorize(3), controller.getAnalytics);

module.exports = router;
