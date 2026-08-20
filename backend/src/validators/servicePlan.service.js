const {
  Service,
  ServicePlan,
  Provider,
} = require('../models');

const AppError = require('../utils/AppError');

const getProvider = async (providerId) => {
  const provider = await Provider.findByPk(providerId);

  if (!provider) {
    throw new AppError(
      'PROVIDER_NOT_FOUND',
      'Provider not found',
      404
    );
  }

  return provider;
};

const checkApprovedProvider = async (providerId) => {
  const provider = await getProvider(providerId);

  if (provider.kyc_status !== 'approved') {
    throw new AppError(
      'PROVIDER_NOT_APPROVED',
      'Provider KYC is not approved',
      403
    );
  }

  return provider;
};

const getOwnedService = async (providerId, serviceId) => {
  const service = await Service.findOne({
    where: {
      id: serviceId,
      provider_id: providerId,
    },
  });

  if (!service) {
    throw new AppError(
      'SERVICE_NOT_FOUND',
      'Service not found',
      404
    );
  }

  return service;
};

const listPlans = async (providerId, serviceId) => {
  await checkApprovedProvider(providerId);

  await getOwnedService(providerId, serviceId);

  return ServicePlan.findAll({
    where: {
      service_id: serviceId,
    },
    order: [['id', 'ASC']],
  });
};

const createPlan = async (providerId, serviceId, data) => {
  await checkApprovedProvider(providerId);

  await getOwnedService(providerId, serviceId);

  const plan = await ServicePlan.create({
    service_id: serviceId,
    frequency: data.frequency,
    price: data.price,
    min_quantity: data.min_quantity ?? 1,
    billing_cycle_days: data.billing_cycle_days,
    is_active: data.is_active ?? true,
  });

  return plan;
};

const updatePlan = async (
  providerId,
  serviceId,
  planId,
  data
) => {
  await checkApprovedProvider(providerId);

  await getOwnedService(providerId, serviceId);

  const plan = await ServicePlan.findOne({
    where: {
      id: planId,
      service_id: serviceId,
    },
  });

  if (!plan) {
    throw new AppError(
      'SERVICE_PLAN_NOT_FOUND',
      'Service plan not found',
      404
    );
  }

  await plan.update(data);

  return plan;
};

const deletePlan = async (
  providerId,
  serviceId,
  planId
) => {
  await checkApprovedProvider(providerId);

  await getOwnedService(providerId, serviceId);

  const plan = await ServicePlan.findOne({
    where: {
      id: planId,
      service_id: serviceId,
    },
  });

  if (!plan) {
    throw new AppError(
      'SERVICE_PLAN_NOT_FOUND',
      'Service plan not found',
      404
    );
  }

  await plan.update({
    is_active: false,
  });

  return {
    message: 'Service plan deactivated successfully',
  };
};

module.exports = {
  listPlans,
  createPlan,
  updatePlan,
  deletePlan,
};