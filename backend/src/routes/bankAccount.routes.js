const express = require("express");

const bankAccountController = require("../controllers/bankAccount.controller");
const authenticate = require("../midleware/auth");
const authorize = require("../midleware/authorize");
const validate = require("../midleware/validate");

const {
  createBankAccountSchema,
  updateBankAccountSchema,
} = require("../validators/bankAccount.validator");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Provider Bank Account
|--------------------------------------------------------------------------
|
| All routes:
|
| authenticate
|      ↓
| authorize(3)
|      ↓
| provider ownership
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| GET /api/providers/bank-account
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  authenticate,
  authorize(3),
  bankAccountController.getMyBankAccount
);

/*
|--------------------------------------------------------------------------
| POST /api/providers/bank-account
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  authenticate,
  authorize(3),
  validate(createBankAccountSchema),
  bankAccountController.createBankAccount
);

/*
|--------------------------------------------------------------------------
| PATCH /api/providers/bank-account
|--------------------------------------------------------------------------
*/

router.patch(
  "/",
  authenticate,
  authorize(3),
  validate(updateBankAccountSchema),
  bankAccountController.updateBankAccount
);

/*
|--------------------------------------------------------------------------
| DELETE /api/providers/bank-account
|--------------------------------------------------------------------------
*/

router.delete(
  "/",
  authenticate,
  authorize(3),
  bankAccountController.deleteBankAccount
);

module.exports = router;