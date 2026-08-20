const express = require("express");

const expenseController = require("../controllers/expense.controller");

const authenticate = require("../midleware/auth");
const authorize = require("../midleware/authorize");
const validate = require("../midleware/validate");

const {
  createExpenseSchema,
  expenseIdSchema,
  updateExpenseSchema,
} = require("../validators/expense.validator");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Provider Expense Routes
|--------------------------------------------------------------------------
|
| All routes:
| authenticate
|     ↓
| authorize provider (role_id = 3)
|     ↓
| provider ownership
|     ↓
| validation
|
|--------------------------------------------------------------------------
*/

router.use(authenticate);
router.use(authorize(3));

/*
|--------------------------------------------------------------------------
| GET /api/providers/expenses
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  expenseController.getExpenses
);

/*
|--------------------------------------------------------------------------
| GET /api/providers/expenses/:id
|--------------------------------------------------------------------------
*/

router.get(
  "/:id",
  validate(expenseIdSchema),
  expenseController.getExpenseById
);

/*
|--------------------------------------------------------------------------
| POST /api/providers/expenses
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  validate(createExpenseSchema),
  expenseController.createExpense
);

/*
|--------------------------------------------------------------------------
| PATCH /api/providers/expenses/:id
|--------------------------------------------------------------------------
*/

router.patch(
  "/:id",
  validate(updateExpenseSchema),
  expenseController.updateExpense
);

/*
|--------------------------------------------------------------------------
| DELETE /api/providers/expenses/:id
|--------------------------------------------------------------------------
*/

router.delete(
  "/:id",
  validate(expenseIdSchema),
  expenseController.deleteExpense
);

module.exports = router;