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

  const escapedUserId = sequelize.escape(numericUserId);

  const [providers] = await sequelize.query(`
    SELECT
      id,
      user_id,
      kyc_status,
      is_active
    FROM providers
    WHERE user_id = ${escapedUserId}
    LIMIT 1
  `);

  if (!providers.length) {
    throw new Error("Provider profile not found");
  }

  return providers[0];
};

/*
|--------------------------------------------------------------------------
| Get Date Range
|--------------------------------------------------------------------------
*/

const getDateRange = (period, from, to) => {
  switch (period) {
    case "today":
      return {
        condition: "BETWEEN CURDATE() AND CURDATE()",
        replacements: {},
      };

    case "yesterday":
      return {
        condition:
          "BETWEEN DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND DATE_SUB(CURDATE(), INTERVAL 1 DAY)",
        replacements: {},
      };

    case "week":
      return {
        condition:
          "BETWEEN DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) AND CURDATE()",
        replacements: {},
      };

    case "month":
      return {
        condition:
          "BETWEEN DATE_FORMAT(CURDATE(), '%Y-%m-01') AND CURDATE()",
        replacements: {},
      };

    case "year":
      return {
        condition:
          "BETWEEN DATE_FORMAT(CURDATE(), '%Y-01-01') AND CURDATE()",
        replacements: {},
      };

    case "custom":
      if (!from || !to) {
        throw new Error(
          "from and to dates are required for custom period"
        );
      }

      if (new Date(from) > new Date(to)) {
        throw new Error(
          "from date cannot be greater than to date"
        );
      }

      return {
        condition: "BETWEEN :fromDate AND :toDate",
        replacements: {
          fromDate: from,
          toDate: to,
        },
      };

    default:
      throw new Error("Invalid accounting period");
  }
};

/*
|--------------------------------------------------------------------------
| Get Accounting Summary
|--------------------------------------------------------------------------
*/

const getAccountingSummary = async (
  userId,
  period,
  from = null,
  to = null
) => {
  const provider = await getProviderByUserId(userId);

  const dateRange = getDateRange(period, from, to);

  /*
  |--------------------------------------------------------------------------
  | Provider Earnings
  |--------------------------------------------------------------------------
  */

  const [earningRows] = await sequelize.query(
    `
      SELECT
        COALESCE(SUM(gross_amount), 0) AS gross_sales,
        COALESCE(SUM(commission_amount), 0) AS platform_commission,
        COALESCE(SUM(refund_amount), 0) AS refunds,
        COALESCE(SUM(net_earning), 0) AS provider_earnings
      FROM provider_earnings
      WHERE provider_id = :providerId
        AND earning_date ${dateRange.condition}
    `,
    {
      replacements: {
        providerId: provider.id,
        ...dateRange.replacements,
      },
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Provider Expenses
  |--------------------------------------------------------------------------
  */

  const [expenseRows] = await sequelize.query(
    `
      SELECT
        COALESCE(SUM(amount), 0) AS expenses
      FROM provider_expenses
      WHERE provider_id = :providerId
        AND expense_date ${dateRange.condition}
    `,
    {
      replacements: {
        providerId: provider.id,
        ...dateRange.replacements,
      },
    }
  );

  const earnings = earningRows[0];
  const expenses = expenseRows[0];

  const grossSales = Number(earnings.gross_sales || 0);
  const platformCommission = Number(
    earnings.platform_commission || 0
  );
  const refunds = Number(earnings.refunds || 0);
  const providerEarnings = Number(
    earnings.provider_earnings || 0
  );
  const providerExpenses = Number(expenses.expenses || 0);

  const netProfit =
    providerEarnings - providerExpenses;

  return {
    period,
    from: from || null,
    to: to || null,

    gross_sales: grossSales.toFixed(2),

    platform_commission:
      platformCommission.toFixed(2),

    refunds: refunds.toFixed(2),

    provider_earnings:
      providerEarnings.toFixed(2),

    expenses:
      providerExpenses.toFixed(2),

    net_profit:
      netProfit.toFixed(2),
  };
};

const getAnalytics = async (userId, from = null, to = null) => {
  const provider = await getProviderByUserId(userId);
  const range = getDateRange("custom", from || "1970-01-01", to || new Date().toISOString().slice(0, 10));
  const replacements = { providerId: provider.id, ...range.replacements };
  const [trend] = await sequelize.query(`SELECT earning_date AS date, COALESCE(SUM(gross_amount),0) AS revenue, COALESCE(SUM(net_earning),0) AS earnings, COALESCE(SUM(commission_amount),0) AS commission FROM provider_earnings WHERE provider_id = :providerId AND earning_date ${range.condition} GROUP BY earning_date ORDER BY earning_date ASC`, { replacements });
  const [orders] = await sequelize.query(`SELECT status, COUNT(*) AS count FROM orders WHERE provider_id=:providerId AND created_at ${range.condition} GROUP BY status`, { replacements });
  const [subscriptions] = await sequelize.query(`SELECT status, COUNT(*) AS count FROM customer_subscriptions WHERE provider_id=:providerId AND created_at ${range.condition} GROUP BY status`, { replacements });
  return { from: from || null, to: to || null, trend, order_statuses: orders, subscription_statuses: subscriptions };
};
module.exports = { getAccountingSummary, getAnalytics };
