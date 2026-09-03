const { sequelize } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Get Provider By User ID
|--------------------------------------------------------------------------
*/

const getProviderByUserId = async (userId) => {
  const numericUserId = Number(userId);

  if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
    throw new Error("Invalid user ID");
  }

  const [providers] = await sequelize.query(
    `
      SELECT
        id,
        user_id,
        kyc_status,
        is_active
      FROM providers
      WHERE user_id = :userId
      LIMIT 1
    `,
    {
      replacements: {
        userId: numericUserId,
      },
    }
  );

  if (!providers.length) {
    throw new Error("Provider profile not found");
  }

  return providers[0];
};

/*
|--------------------------------------------------------------------------
| Get Expense For Provider
|--------------------------------------------------------------------------
| Checks both expense ID and provider ID.
| This prevents one provider from accessing another provider's expense.
|--------------------------------------------------------------------------
*/

const getExpenseForProvider = async (expenseId, providerId) => {
  const numericExpenseId = Number(expenseId);
  const numericProviderId = Number(providerId);

  if (
    !Number.isInteger(numericExpenseId) ||
    numericExpenseId <= 0
  ) {
    throw new Error("Invalid expense ID");
  }

  if (
    !Number.isInteger(numericProviderId) ||
    numericProviderId <= 0
  ) {
    throw new Error("Invalid provider ID");
  }

  const [expenses] = await sequelize.query(
    `
      SELECT
        id,
        provider_id,
        category,
        amount,
        expense_date,
        description,
        receipt_url,
        created_at,
        updated_at
      FROM provider_expenses
      WHERE id = :expenseId
      LIMIT 1
    `,
    {
      replacements: {
        expenseId: numericExpenseId,
      },
    }
  );

  if (!expenses.length) {
    throw new Error("Expense not found");
  }

  if (Number(expenses[0].provider_id) !== Number(numericProviderId)) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  return expenses[0];
};

/*
|--------------------------------------------------------------------------
| Get All Expenses
|--------------------------------------------------------------------------
*/

const getExpenses = async (userId) => {
  const provider = await getProviderByUserId(userId);

  const [expenses] = await sequelize.query(
    `
      SELECT
        id,
        provider_id,
        category,
        amount,
        expense_date,
        description,
        receipt_url,
        created_at,
        updated_at
      FROM provider_expenses
      WHERE provider_id = :providerId
      ORDER BY expense_date DESC, id DESC
    `,
    {
      replacements: {
        providerId: provider.id,
      },
    }
  );

  return expenses;
};

/*
|--------------------------------------------------------------------------
| Get Expense By ID
|--------------------------------------------------------------------------
*/

const getExpenseById = async (userId, expenseId) => {
  const provider = await getProviderByUserId(userId);

  return getExpenseForProvider(
    expenseId,
    provider.id
  );
};

/*
|--------------------------------------------------------------------------
| Create Expense
|--------------------------------------------------------------------------
*/

const createExpense = async (userId, data) => {
  const provider = await getProviderByUserId(userId);

  const {
    category,
    amount,
    expense_date,
    description = null,
    receipt_url = null,
  } = data;

  /*
  |--------------------------------------------------------------------------
  | Insert Expense
  |--------------------------------------------------------------------------
  */

  await sequelize.query(
    `
      INSERT INTO provider_expenses
      (
        provider_id,
        category,
        amount,
        expense_date,
        description,
        receipt_url,
        created_at,
        updated_at
      )
      VALUES
      (
        :providerId,
        :category,
        :amount,
        :expenseDate,
        :description,
        :receiptUrl,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `,
    {
      replacements: {
        providerId: provider.id,
        category,
        amount,
        expenseDate: expense_date,
        description,
        receiptUrl: receipt_url,
      },
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Fetch Created Expense
  |--------------------------------------------------------------------------
  */

  const [expenses] = await sequelize.query(
    `
      SELECT
        id,
        provider_id,
        category,
        amount,
        expense_date,
        description,
        receipt_url,
        created_at,
        updated_at
      FROM provider_expenses
      WHERE provider_id = :providerId
      ORDER BY id DESC
      LIMIT 1
    `,
    {
      replacements: {
        providerId: provider.id,
      },
    }
  );

  if (!expenses.length) {
    throw new Error(
      "Expense was created but could not be retrieved"
    );
  }

  return expenses[0];
};

/*
|--------------------------------------------------------------------------
| Update Expense
|--------------------------------------------------------------------------
*/

const updateExpense = async (
  userId,
  expenseId,
  data
) => {
  const provider = await getProviderByUserId(userId);

  /*
  |--------------------------------------------------------------------------
  | Verify Ownership
  |--------------------------------------------------------------------------
  */

  await getExpenseForProvider(
    expenseId,
    provider.id
  );

  /*
  |--------------------------------------------------------------------------
  | Allowed Fields
  |--------------------------------------------------------------------------
  */

  const allowedFields = [
    "category",
    "amount",
    "expense_date",
    "description",
    "receipt_url",
  ];

  const updates = [];

  const replacements = {
    expenseId: Number(expenseId),
    providerId: provider.id,
  };

  /*
  |--------------------------------------------------------------------------
  | Build Dynamic Update
  |--------------------------------------------------------------------------
  */

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updates.push(`${field} = :${field}`);
      replacements[field] = data[field];
    }
  }

  if (!updates.length) {
    throw new Error("No fields to update");
  }

  updates.push(
    "updated_at = CURRENT_TIMESTAMP"
  );

  /*
  |--------------------------------------------------------------------------
  | Update Database
  |--------------------------------------------------------------------------
  */

  await sequelize.query(
    `
      UPDATE provider_expenses
      SET
        ${updates.join(", ")}
      WHERE id = :expenseId
        AND provider_id = :providerId
    `,
    {
      replacements,
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Return Updated Expense
  |--------------------------------------------------------------------------
  */

  return getExpenseForProvider(
    expenseId,
    provider.id
  );
};

/*
|--------------------------------------------------------------------------
| Delete Expense
|--------------------------------------------------------------------------
*/

const deleteExpense = async (
  userId,
  expenseId
) => {
  const provider = await getProviderByUserId(userId);

  /*
  |--------------------------------------------------------------------------
  | Verify Ownership
  |--------------------------------------------------------------------------
  */

  await getExpenseForProvider(
    expenseId,
    provider.id
  );

  /*
  |--------------------------------------------------------------------------
  | Delete
  |--------------------------------------------------------------------------
  */

  await sequelize.query(
    `
      DELETE FROM provider_expenses
      WHERE id = :expenseId
        AND provider_id = :providerId
    `,
    {
      replacements: {
        expenseId: Number(expenseId),
        providerId: provider.id,
      },
    }
  );

  return {
    id: Number(expenseId),
  };
};

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

module.exports = {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
};