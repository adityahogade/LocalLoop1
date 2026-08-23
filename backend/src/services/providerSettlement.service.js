const { sequelize } = require("../config/database");
const { ProviderSettlement, ProviderEarning, Provider, AuditLog } = require("../models");
const notifications = require("./notification.service");
const AppError = require("../utils/AppError");

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
| Get Settlement For Provider
|--------------------------------------------------------------------------
*/

const getSettlementForProvider = async (
  settlementId,
  providerId
) => {
  const numericSettlementId = Number(settlementId);
  const numericProviderId = Number(providerId);

  if (
    !Number.isInteger(numericSettlementId) ||
    numericSettlementId <= 0
  ) {
    throw new Error("Invalid settlement ID");
  }

  if (
    !Number.isInteger(numericProviderId) ||
    numericProviderId <= 0
  ) {
    throw new Error("Invalid provider ID");
  }

  const [settlements] = await sequelize.query(
    `
      SELECT
        id,
        provider_id,
        period_start,
        period_end,
        total_earnings,
        status,
        requested_at,
        processed_by,
        processed_at,
        payout_reference,
        rejection_reason,
        created_at,
        updated_at
      FROM provider_settlements
      WHERE id = :settlementId
      LIMIT 1
    `,
    {
      replacements: {
        settlementId: numericSettlementId,
      },
    }
  );

  if (!settlements.length) {
    throw new Error("Settlement not found");
  }

  if (Number(settlements[0].provider_id) !== Number(numericProviderId)) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  return settlements[0];
};

/*
|--------------------------------------------------------------------------
| Get All Provider Settlements
|--------------------------------------------------------------------------
*/

const getSettlements = async (userId) => {
  const provider = await getProviderByUserId(userId);

  const [settlements] = await sequelize.query(
    `
      SELECT
        id,
        provider_id,
        period_start,
        period_end,
        total_earnings,
        status,
        requested_at,
        processed_by,
        processed_at,
        payout_reference,
        rejection_reason,
        created_at,
        updated_at
      FROM provider_settlements
      WHERE provider_id = :providerId
      ORDER BY period_start DESC, id DESC
    `,
    {
      replacements: {
        providerId: provider.id,
      },
    }
  );

  return settlements;
};

/*
|--------------------------------------------------------------------------
| Get Settlement By ID
|--------------------------------------------------------------------------
*/

const getSettlementById = async (
  userId,
  settlementId
) => {
  const provider = await getProviderByUserId(userId);

  return getSettlementForProvider(
    settlementId,
    provider.id
  );
};

/*
|--------------------------------------------------------------------------
| Calculate Provider Earnings
|--------------------------------------------------------------------------
|
| provider_earnings.net_earning is used as the amount that the provider
| earned during the requested settlement period.
|
*/

const calculatePeriodEarnings = async (
  providerId,
  periodStart,
  periodEnd
) => {
  const [result] = await sequelize.query(
    `
      SELECT
        COALESCE(
          SUM(net_earning),
          0
        ) AS total_earnings
      FROM provider_earnings
      WHERE provider_id = :providerId
        AND earning_date BETWEEN :periodStart AND :periodEnd
    `,
    {
      replacements: {
        providerId,
        periodStart,
        periodEnd,
      },
    }
  );

  return result[0]?.total_earnings || "0.00";
};

/*
|--------------------------------------------------------------------------
| Check Existing Settlement
|--------------------------------------------------------------------------
*/

const checkExistingSettlement = async (
  providerId,
  periodStart,
  periodEnd
) => {
  const [settlements] = await sequelize.query(
    `
      SELECT
        id,
        status
      FROM provider_settlements
      WHERE provider_id = :providerId
        AND period_start = :periodStart
        AND period_end = :periodEnd
      LIMIT 1
    `,
    {
      replacements: {
        providerId,
        periodStart,
        periodEnd,
      },
    }
  );

  return settlements.length
    ? settlements[0]
    : null;
};

/*
|--------------------------------------------------------------------------
| Create Settlement
|--------------------------------------------------------------------------
*/
/*
|--------------------------------------------------------------------------
| Create Settlement
|--------------------------------------------------------------------------
*/

const createSettlement = async (
  userId,
  data
) => {
  /*
  |--------------------------------------------------------------------------
  | Get Provider
  |--------------------------------------------------------------------------
  */

  const provider = await getProviderByUserId(userId);

  /*
  |--------------------------------------------------------------------------
  | Read Request Data
  |--------------------------------------------------------------------------
  */

  const {
    period_start,
    period_end,
  } = data || {};

  /*
  |--------------------------------------------------------------------------
  | Validate Dates
  |--------------------------------------------------------------------------
  */

  if (!period_start || !period_end) {
    throw new Error(
      "period_start and period_end are required"
    );
  }

  const startDate = new Date(period_start);
  const endDate = new Date(period_end);

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime())
  ) {
    throw new Error("Invalid settlement dates");
  }

  if (endDate < startDate) {
    throw new Error(
      "period_end cannot be before period_start"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Prevent Duplicate Settlement
  |--------------------------------------------------------------------------
  */

  const existing = await checkExistingSettlement(
    provider.id,
    period_start,
    period_end
  );

  if (existing) {
    throw new Error(
      `Settlement already exists for this period with status: ${existing.status}`
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Calculate Provider Earnings
  |--------------------------------------------------------------------------
  */

  const totalEarnings =
    await calculatePeriodEarnings(
      provider.id,
      period_start,
      period_end
    );

  /*
  |--------------------------------------------------------------------------
  | Transaction
  |--------------------------------------------------------------------------
  */

  const transaction =
    await sequelize.transaction();

  try {
    /*
    |--------------------------------------------------------------------------
    | Insert Settlement
    |--------------------------------------------------------------------------
    */

    await sequelize.query(
      `
        INSERT INTO provider_settlements
        (
          provider_id,
          period_start,
          period_end,
          total_earnings,
          status,
          requested_at,
          created_at,
          updated_at
        )
        VALUES
        (
          :providerId,
          :periodStart,
          :periodEnd,
          :totalEarnings,
          'requested',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `,
      {
        replacements: {
          providerId: provider.id,
          periodStart: period_start,
          periodEnd: period_end,
          totalEarnings,
        },
        transaction,
      }
    );

    /*
    |--------------------------------------------------------------------------
    | Get AUTO_INCREMENT ID
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    | LAST_INSERT_ID() must be executed using the same transaction/
    | database connection as the INSERT.
    |
    */

    const [insertIdResult] =
      await sequelize.query(
        `
          SELECT LAST_INSERT_ID() AS settlement_id
        `,
        {
          transaction,
        }
      );

    const settlementId =
      Number(
        insertIdResult?.[0]?.settlement_id
      );

    /*
    |--------------------------------------------------------------------------
    | Validate Generated ID
    |--------------------------------------------------------------------------
    */

    if (
      !Number.isInteger(settlementId) ||
      settlementId <= 0
    ) {
      throw new Error(
        "Settlement was created but settlement ID could not be retrieved"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Commit Transaction
    |--------------------------------------------------------------------------
    */

    await transaction.commit();

    /*
    |--------------------------------------------------------------------------
    | Retrieve Created Settlement
    |--------------------------------------------------------------------------
    */

    return getSettlementForProvider(
      settlementId,
      provider.id
    );

  } catch (error) {
    /*
    |--------------------------------------------------------------------------
    | Rollback
    |--------------------------------------------------------------------------
    */

    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error(
        "Settlement rollback failed:",
        rollbackError
      );
    }

    throw error;
  }
};
const listAdminSettlements = () => ProviderSettlement.findAll({ order: [["created_at", "DESC"]] });

const updateAdminSettlement = async (adminUserId, id, data) => {
  const settlement = await ProviderSettlement.findByPk(id);
  if (!settlement) throw new AppError("Settlement not found", 404, "SETTLEMENT_NOT_FOUND");
  const allowed = ["status", "payout_reference", "rejection_reason"];
  const updates = Object.fromEntries(Object.entries(data).filter(([key]) => allowed.includes(key)));
  if (!Object.keys(updates).length) throw new AppError("No settlement fields to update", 400, "NO_FIELDS_TO_UPDATE");
  if (updates.status && !["requested", "approved", "paid", "rejected"].includes(updates.status)) throw new AppError("Invalid settlement status", 400, "INVALID_SETTLEMENT_STATUS");
  const oldValues = settlement.toJSON();
  await settlement.update({ ...updates, processed_by: adminUserId, processed_at: new Date() });
  if (updates.status === "paid") await ProviderEarning.update({ settlement_id: settlement.id }, { where: { provider_id: settlement.provider_id, settlement_id: null } });
  await AuditLog.create({ user_id: adminUserId, action: "update_settlement", entity_type: "provider_settlement", entity_id: settlement.id, old_values_json: oldValues, new_values_json: settlement.toJSON() });
  if (updates.status) {
    const provider = await Provider.findByPk(settlement.provider_id, { attributes: ["user_id"] });
    if (provider?.user_id) await notifications.createOnce({ user_id: provider.user_id, type: "settlement_updated", title: "Settlement updated", body: `Your settlement is now ${updates.status}.`, reference_type: "provider_settlement", reference_id: settlement.id });
  }
  return settlement;
};

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

module.exports = {
  getSettlements,
  getSettlementById,
  createSettlement,
  listAdminSettlements,
  updateAdminSettlement,
};
