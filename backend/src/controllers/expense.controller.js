const expenseService = require("../services/expense.service");

/*
|--------------------------------------------------------------------------
| Get Authenticated User ID
|--------------------------------------------------------------------------
*/

const getUserId = (req) => {
  return req.user?.userId ?? req.user?.id;
};

/*
|--------------------------------------------------------------------------
| Get All Expenses
|--------------------------------------------------------------------------
*/

const getExpenses = async (req, res, next) => {
  try {
    console.log("EXPENSE USER:", req.user);

    const userId = getUserId(req);

    console.log("EXPENSE USER ID:", userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: "AUTH_USER_ID_MISSING",
          message: "Authenticated user ID is missing",
        },
      });
    }

    const expenses = await expenseService.getExpenses(userId);

    return res.status(200).json({
      success: true,
      message: "Expenses fetched successfully",
      data: expenses,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Get Expense By ID
|--------------------------------------------------------------------------
*/

const getExpenseById = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: "AUTH_USER_ID_MISSING",
          message: "Authenticated user ID is missing",
        },
      });
    }

    const expense = await expenseService.getExpenseById(
      userId,
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Expense fetched successfully",
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Create Expense
|--------------------------------------------------------------------------
*/

const createExpense = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: "AUTH_USER_ID_MISSING",
          message: "Authenticated user ID is missing",
        },
      });
    }

    const expense = await expenseService.createExpense(
      userId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Update Expense
|--------------------------------------------------------------------------
*/

const updateExpense = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: "AUTH_USER_ID_MISSING",
          message: "Authenticated user ID is missing",
        },
      });
    }

    const expense = await expenseService.updateExpense(
      userId,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Delete Expense
|--------------------------------------------------------------------------
*/

const deleteExpense = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: "AUTH_USER_ID_MISSING",
          message: "Authenticated user ID is missing",
        },
      });
    }

    await expenseService.deleteExpense(
      userId,
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
};