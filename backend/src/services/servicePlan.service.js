const {
  Service,
  ServicePlan,
  Provider,
} = require("../models");

const AppError = require("../utils/AppError");

/*
|--------------------------------------------------------------------------
| Get Provider ID From Logged-in User
|--------------------------------------------------------------------------
*/

const getProviderIdByUserId = async (userId) => {
  const numericUserId = Number(userId);

  if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
    throw new AppError(
      "Invalid user ID",
      400,
      "INVALID_USER_ID"
    );
  }

  const provider = await Provider.findOne({
    where: {
      user_id: numericUserId,
    },
  });

  if (!provider) {
    throw new AppError(
      "Provider not found",
      404,
      "PROVIDER_NOT_FOUND"
    );
  }

  return provider.id;
};

/*
|--------------------------------------------------------------------------
| Get Provider
|--------------------------------------------------------------------------
*/

const getProvider = async (providerId) => {
  const provider = await Provider.findByPk(providerId);

  if (!provider) {
    throw new AppError(
      "Provider not found",
      404,
      "PROVIDER_NOT_FOUND"
    );
  }

  return provider;
};

/*
|--------------------------------------------------------------------------
| Check Provider KYC
|--------------------------------------------------------------------------
*/

const checkApprovedProvider = async (providerId) => {
  const provider = await getProvider(providerId);

  if (provider.kyc_status !== "approved") {
    throw new AppError(
      "Provider KYC is not approved",
      403,
      "PROVIDER_NOT_APPROVED"
    );
  }

  return provider;
};

/*
|--------------------------------------------------------------------------
| Get Owned Service
|--------------------------------------------------------------------------
*/

const getOwnedService = async (
  providerId,
  serviceId
) => {
  const numericServiceId = Number(serviceId);

  if (
    !Number.isInteger(numericServiceId) ||
    numericServiceId <= 0
  ) {
    throw new AppError(
      "Invalid service ID",
      400,
      "INVALID_SERVICE_ID"
    );
  }

  const service = await Service.findByPk(numericServiceId);

  if (!service) {
    throw new AppError(
      "Service not found",
      404,
      "SERVICE_NOT_FOUND"
    );
  }

  if (Number(service.provider_id) !== Number(providerId)) {
    throw new AppError(
      "Forbidden",
      403,
      "FORBIDDEN"
    );
  }

  return service;
};

/*
|--------------------------------------------------------------------------
| List Service Plans
|--------------------------------------------------------------------------
*/

const listPlans = async (
  providerId,
  serviceId
) => {
  await checkApprovedProvider(providerId);

  await getOwnedService(
    providerId,
    serviceId
  );

  return ServicePlan.findAll({
    where: {
      service_id: Number(serviceId),
    },
    order: [
      ["id", "ASC"],
    ],
  });
};

/*
|--------------------------------------------------------------------------
| Create Service Plan
|--------------------------------------------------------------------------
*/

const createPlan = async (
  providerId,
  serviceId,
  data
) => {
  await checkApprovedProvider(providerId);

  await getOwnedService(
    providerId,
    serviceId
  );

  const plan = await ServicePlan.create({
    service_id: Number(serviceId),
    frequency: data.frequency,
    price: data.price,
    min_quantity:
      data.min_quantity ?? 1,
    billing_cycle_days:
      data.billing_cycle_days,
    is_active:
      data.is_active ?? true,
  });

  return plan;
};

/*
|--------------------------------------------------------------------------
| Update Service Plan
|--------------------------------------------------------------------------
*/

const updatePlan = async (
  providerId,
  serviceId,
  planId,
  data
) => {
  await checkApprovedProvider(providerId);

  await getOwnedService(
    providerId,
    serviceId
  );

  const plan = await ServicePlan.findOne({ where: { id: Number(planId) } });

  if (!plan) {
    throw new AppError(
      "Service plan not found",
      404,
      "SERVICE_PLAN_NOT_FOUND"
    );
  }

  if (Number(plan.service_id) !== Number(serviceId)) {
    throw new AppError(
      "Forbidden",
      403,
      "FORBIDDEN"
    );
  }

  await plan.update(data);

  return plan;
};

/*
|--------------------------------------------------------------------------
| Delete / Deactivate Service Plan
|--------------------------------------------------------------------------
*/

const deletePlan = async (
  providerId,
  serviceId,
  planId
) => {
  await checkApprovedProvider(providerId);

  await getOwnedService(
    providerId,
    serviceId
  );

  const plan = await ServicePlan.findOne({ where: { id: Number(planId) } });

  if (!plan) {
    throw new AppError(
      "Service plan not found",
      404,
      "SERVICE_PLAN_NOT_FOUND"
    );
  }

  if (Number(plan.service_id) !== Number(serviceId)) {
    throw new AppError(
      "Forbidden",
      403,
      "FORBIDDEN"
    );
  }

  await plan.update({
    is_active: false,
  });

  return {
    id: plan.id,
    service_id: plan.service_id,
    is_active: false,
  };
};

module.exports = {
  getProviderIdByUserId,
  getProvider,
  checkApprovedProvider,
  getOwnedService,
  listPlans,
  createPlan,
  updatePlan,
  deletePlan,
};