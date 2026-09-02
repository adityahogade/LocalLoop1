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
const listAdminSettlements = () => ProviderSettlement.findAll({
  include: [{ model: require("../models").Provider, as: "provider", attributes: ["id", "business_name"] }],
  order: [["created_at", "DESC"]]
});

const updateAdminSettlement = async (adminUserId, id, data) => {
  const settlement = await ProviderSettlement.findByPk(id);
  if (!settlement) throw new AppError("Settlement not found", 404, "SETTLEMENT_NOT_FOUND");
  if (settlement.status === "paid" && data.status === "paid") {
    return settlement;
  }
  const allowed = ["status", "payout_reference", "rejection_reason"];
  const updates = Object.fromEntries(Object.entries(data).filter(([key]) => allowed.includes(key)));
  if (!Object.keys(updates).length) throw new AppError("No settlement fields to update", 400, "NO_FIELDS_TO_UPDATE");
  if (updates.status && !["requested", "approved", "paid", "rejected"].includes(updates.status)) throw new AppError("Invalid settlement status", 400, "INVALID_SETTLEMENT_STATUS");
  const oldValues = settlement.toJSON();
  await settlement.update({ ...updates, processed_by: adminUserId, processed_at: new Date() });
  if (updates.status === "paid") await ProviderEarning.update({ settlement_id: settlement.id }, { where: { provider_id: settlement.provider_id, settlement_id: null } });
  await AuditLog.create({ user_id: adminUserId, action: "update_settlement", entity_type: "provider_settlement", entity_id: settlement.id, old_values_json: oldValues, new_values_json: settlement.toJSON() });
  if (updates.status) {
    const provider = await require("../models").Provider.findByPk(settlement.provider_id, { attributes: ["user_id"] });
    if (provider?.user_id) await notifications.createOnce({ user_id: provider.user_id, type: "settlement_updated", title: "Settlement updated", body: `Your settlement is now ${updates.status}.`, reference_type: "provider_settlement", reference_id: settlement.id });
  }
  return settlement;
};

const getProviderSettlementsOverview = async () => {
  const { Provider, User, Service, Customer, CustomerSubscription, SubscriptionDelivery, Order } = require("../models");
  
  const providers = await Provider.findAll({
    include: [{ model: User, as: "user", attributes: ["id", "full_name", "email", "phone"] }],
    order: [["id", "ASC"]]
  });

  const overview = [];

  for (const prov of providers) {
    const earnings = await ProviderEarning.findAll({
      where: { provider_id: prov.id },
      order: [["earning_date", "DESC"], ["id", "DESC"]]
    });

    let grossTotal = 0;
    let settledTotal = 0;
    let pendingTotal = 0;

    const detailedEarnings = [];

    for (const e of earnings) {
      const gross = Number(e.gross_amount || 0);
      const net = Number(e.net_earning || 0);
      const commission = Number(e.commission_amount || 0);
      grossTotal += gross;

      if (e.settlement_id) {
        settledTotal += net;
      } else {
        pendingTotal += net;
      }

      let serviceName = "Service Delivery";
      let customerName = "Customer";
      let quantity = 1;
      let unit = "unit";

      try {
        if (e.source_type === "subscription_delivery") {
          const delivery = await SubscriptionDelivery.findByPk(e.source_id, {
            include: [{
              model: CustomerSubscription,
              as: "subscription",
              include: [
                { model: Service, as: "service", attributes: ["name", "unit"] },
                { model: Customer, as: "customer", include: [{ model: User, as: "user", attributes: ["full_name"] }] }
              ]
            }]
          });
          if (delivery?.subscription) {
            serviceName = delivery.subscription.service?.name || "Subscription Service";
            unit = delivery.subscription.service?.unit || "unit";
            customerName = delivery.subscription.customer?.user?.full_name || "Customer";
            quantity = Number(delivery.quantity || delivery.subscription.quantity || 1);
          }
        } else if (e.source_type === "subscription_payment" || e.source_type === "subscription") {
          const subPayment = await require("../models").SubscriptionPayment.findByPk(e.source_id, {
            include: [{
              model: CustomerSubscription,
              as: "subscription",
              include: [
                { model: Service, as: "service", attributes: ["name", "unit"] },
                { model: Customer, as: "customer", include: [{ model: User, as: "user", attributes: ["full_name"] }] }
              ]
            }]
          });
          if (subPayment?.subscription) {
            serviceName = subPayment.subscription.service?.name || "Subscription Service";
            unit = subPayment.subscription.service?.unit || "unit";
            customerName = subPayment.subscription.customer?.user?.full_name || "Customer";
            quantity = Number(subPayment.subscription.quantity || 1);
          }
        } else if (e.source_type === "subscription_payment" || e.source_type === "subscription") {
          const subPayment = await require("../models").SubscriptionPayment.findByPk(e.source_id, {
            include: [{
              model: CustomerSubscription,
              as: "subscription",
              include: [
                { model: Service, as: "service", attributes: ["name", "unit"] },
                { model: Customer, as: "customer", include: [{ model: User, as: "user", attributes: ["full_name"] }] }
              ]
            }]
          });
          if (subPayment?.subscription) {
            serviceName = subPayment.subscription.service?.name || "Subscription Service";
            unit = subPayment.subscription.service?.unit || "unit";
            customerName = subPayment.subscription.customer?.user?.full_name || "Customer";
            quantity = Number(subPayment.subscription.quantity || 1);
          }
        } else if (e.source_type === "order") {
          const order = await Order.findByPk(e.source_id, {
            include: [
              { model: Customer, as: "customer", include: [{ model: User, as: "user", attributes: ["full_name"] }] },
              { model: require("../models").OrderItem, as: "items", include: [{ model: Service, as: "service", attributes: ["name", "unit"] }] }
            ]
          });
          if (order) {
            serviceName = order.items?.[0]?.service?.name || "One-Time Service";
            unit = order.items?.[0]?.service?.unit || "unit";
            customerName = order.customer?.user?.full_name || "Customer";
            quantity = Number(order.items?.[0]?.quantity || 1);
          }
        }
      } catch (err) {
        // fallback to defaults
      }

      detailedEarnings.push({
        id: e.id,
        service_name: serviceName,
        customer_name: customerName,
        date: e.earning_date,
        quantity,
        unit,
        rate: Number(net / (quantity || 1)).toFixed(2),
        gross_amount: gross.toFixed(2),
        commission_percentage: Number(e.commission_rate_applied || 10).toFixed(2),
        commission_amount: commission.toFixed(2),
        provider_payable: net.toFixed(2),
        status: e.settlement_id ? "Settled" : "Pending",
        settlement_id: e.settlement_id
      });
    }

    overview.push({
      provider_id: prov.id,
      business_name: prov.business_name || "Provider Store",
      provider_name: prov.user?.full_name || "Provider",
      email: prov.user?.email,
      phone: prov.user?.phone,
      completed_services: earnings.length,
      gross_earnings: grossTotal.toFixed(2),
      already_settled: settledTotal.toFixed(2),
      pending_settlement: pendingTotal.toFixed(2),
      status: pendingTotal > 0 ? "Pending Settlement" : "Settled",
      earnings: detailedEarnings
    });
  }

  return overview;
};

const settleProvider = async (adminUserId, providerId, payoutReference = null) => {
  const numericProviderId = Number(providerId);
  const provider = await Provider.findByPk(numericProviderId);
  if (!provider) throw new AppError("Provider not found", 404, "PROVIDER_NOT_FOUND");

  const unsettledEarnings = await ProviderEarning.findAll({
    where: { provider_id: numericProviderId, settlement_id: null },
    order: [["earning_date", "ASC"]]
  });

  if (!unsettledEarnings.length) {
    return {
      message: "Provider has no pending earnings to settle.",
      already_settled: true,
      settled_amount: "0.00"
    };
  }

  let totalNet = 0;
  for (const item of unsettledEarnings) {
    totalNet += Number(item.net_earning || 0);
  }

  const periodStart = unsettledEarnings[0].earning_date || new Date().toISOString().slice(0, 10);
  const periodEnd = unsettledEarnings[unsettledEarnings.length - 1].earning_date || new Date().toISOString().slice(0, 10);
  const reference = payoutReference || `SETTLE-${Date.now()}-${numericProviderId}`;

  return sequelize.transaction(async (transaction) => {
    const settlement = await ProviderSettlement.create({
      provider_id: numericProviderId,
      period_start: periodStart,
      period_end: periodEnd,
      total_earnings: totalNet,
      status: "paid",
      requested_at: new Date(),
      processed_by: adminUserId,
      processed_at: new Date(),
      payout_reference: reference
    }, { transaction });

    await ProviderEarning.update(
      { settlement_id: settlement.id },
      { where: { provider_id: numericProviderId, settlement_id: null }, transaction }
    );

    await AuditLog.create({
      user_id: adminUserId,
      action: "provider_settled",
      entity_type: "provider_settlement",
      entity_id: settlement.id,
      new_values_json: settlement.toJSON()
    }, { transaction });

    if (provider.user_id) {
      await notifications.createOnce({
        user_id: provider.user_id,
        type: "settlement_updated",
        title: "Settlement Paid",
        body: `Your payout settlement of ₹${totalNet.toFixed(2)} has been processed. Reference: ${reference}`,
        reference_type: "provider_settlement",
        reference_id: settlement.id,
        transaction
      });
    }

    return settlement;
  });
};

const getProviderEarningsSummary = async (userId) => {
  const provider = await getProviderByUserId(userId);
  const { Service, Customer, User, CustomerSubscription, SubscriptionDelivery, Order } = require("../models");

  const earnings = await ProviderEarning.findAll({
    where: { provider_id: provider.id },
    order: [["earning_date", "DESC"], ["id", "DESC"]]
  });

  const settlements = await ProviderSettlement.findAll({
    where: { provider_id: provider.id },
    order: [["created_at", "DESC"]]
  });

  let totalEarnings = 0;
  let settledAmount = 0;
  let pendingSettlement = 0;

  const recentServices = [];

  for (const e of earnings) {
    const net = Number(e.net_earning || 0);
    const gross = Number(e.gross_amount || 0);
    const commission = Number(e.commission_amount || 0);
    totalEarnings += net;

    if (e.settlement_id) {
      settledAmount += net;
    } else {
      pendingSettlement += net;
    }

    let serviceName = "Service Delivery";
    let customerName = "Customer";
    let quantity = 1;
    let unit = "unit";

    try {
      if (e.source_type === "subscription_delivery") {
        const delivery = await SubscriptionDelivery.findByPk(e.source_id, {
          include: [{
            model: CustomerSubscription,
            as: "subscription",
            include: [
              { model: Service, as: "service", attributes: ["name", "unit"] },
              { model: Customer, as: "customer", include: [{ model: User, as: "user", attributes: ["full_name"] }] }
            ]
          }]
        });
        if (delivery?.subscription) {
          serviceName = delivery.subscription.service?.name || "Subscription Service";
          unit = delivery.subscription.service?.unit || "unit";
          customerName = delivery.subscription.customer?.user?.full_name || "Customer";
          quantity = Number(delivery.quantity || delivery.subscription.quantity || 1);
        }
      } else if (e.source_type === "order") {
        const order = await Order.findByPk(e.source_id, {
          include: [
            { model: Customer, as: "customer", include: [{ model: User, as: "user", attributes: ["full_name"] }] },
            { model: require("../models").OrderItem, as: "items", include: [{ model: Service, as: "service", attributes: ["name", "unit"] }] }
          ]
        });
        if (order) {
          serviceName = order.items?.[0]?.service?.name || "One-Time Service";
          unit = order.items?.[0]?.service?.unit || "unit";
          customerName = order.customer?.user?.full_name || "Customer";
          quantity = Number(order.items?.[0]?.quantity || 1);
        }
      }
    } catch (err) {
      // ignore
    }

    recentServices.push({
      id: e.id,
      service_name: serviceName,
      customer_name: customerName,
      date: e.earning_date,
      quantity,
      unit,
      rate: Number(net / (quantity || 1)).toFixed(2),
      gross_amount: gross.toFixed(2),
      commission_amount: commission.toFixed(2),
      provider_payable: net.toFixed(2),
      status: e.settlement_id ? "Settled" : "Pending",
      settlement_id: e.settlement_id
    });
  }

  return {
    total_earnings: totalEarnings.toFixed(2),
    pending_settlement: pendingSettlement.toFixed(2),
    settled_amount: settledAmount.toFixed(2),
    recent_services: recentServices,
    settlement_history: settlements
  };
};

module.exports = {
  getSettlements,
  getSettlementById,
  createSettlement,
  listAdminSettlements,
  updateAdminSettlement,
  getProviderSettlementsOverview,
  settleProvider,
  getProviderEarningsSummary,
};
