const {
  ServiceArea,
  Provider,
} = require('../models');

const AppError = require('../utils/AppError');

const checkProvider = async (providerId) => {
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

const listAreas = async (providerId) => {
  await checkProvider(providerId);

  return ServiceArea.findAll({
    where: {
      provider_id: providerId,
    },
    order: [['id', 'ASC']],
  });
};

const createArea = async (providerId, data) => {
  await checkProvider(providerId);

  const existing = await ServiceArea.findOne({
    where: {
      provider_id: providerId,
      pincode: data.pincode,
    },
  });

  if (existing) {
    throw new AppError(
      'SERVICE_AREA_EXISTS',
      'This pincode is already configured',
      409
    );
  }

  return ServiceArea.create({
    provider_id: providerId,
    state: data.state,
    city: data.city,
    area: data.area ?? null,
    pincode: data.pincode,
  });
};

const updateArea = async (
  providerId,
  areaId,
  data
) => {
  await checkProvider(providerId);

  const area = await ServiceArea.findOne({
    where: {
      id: areaId,
      provider_id: providerId,
    },
  });

  if (!area) {
    throw new AppError(
      'SERVICE_AREA_NOT_FOUND',
      'Service area not found',
      404
    );
  }

  if (
    data.pincode &&
    data.pincode !== area.pincode
  ) {
    const duplicate = await ServiceArea.findOne({
      where: {
        provider_id: providerId,
        pincode: data.pincode,
      },
    });

    if (duplicate) {
      throw new AppError(
        'SERVICE_AREA_EXISTS',
        'This pincode is already configured',
        409
      );
    }
  }

  await area.update(data);

  return area;
};

const deleteArea = async (
  providerId,
  areaId
) => {
  await checkProvider(providerId);

  const area = await ServiceArea.findOne({
    where: {
      id: areaId,
      provider_id: providerId,
    },
  });

  if (!area) {
    throw new AppError(
      'SERVICE_AREA_NOT_FOUND',
      'Service area not found',
      404
    );
  }

  await area.destroy();

  return {
    message: 'Service area deleted successfully',
  };
};

module.exports = {
  listAreas,
  createArea,
  updateArea,
  deleteArea,
};