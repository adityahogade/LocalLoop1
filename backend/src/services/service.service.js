const {
  Service,
  Provider,
  Category,
} = require("../models");

const AppError = require("../utils/AppError");

/*
|--------------------------------------------------------------------------
| Get Provider ID From User ID
|--------------------------------------------------------------------------
*/

const getProviderIdByUserId = async (userId) => {
  const numericUserId = Number(userId);

  if (
    !Number.isInteger(numericUserId) ||
    numericUserId <= 0
  ) {
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

  return provider;
};

/*
|--------------------------------------------------------------------------
| Check Provider
|--------------------------------------------------------------------------
*/

const getProvider = async (userId) => {
  return getProviderIdByUserId(userId);
};

/*
|--------------------------------------------------------------------------
| Check Category
|--------------------------------------------------------------------------
*/

const getCategory = async (categoryId) => {
  const numericCategoryId = Number(categoryId);

  if (
    !Number.isInteger(numericCategoryId) ||
    numericCategoryId <= 0
  ) {
    throw new AppError(
      "Invalid category ID",
      400,
      "INVALID_CATEGORY_ID"
    );
  }

  const category = await Category.findOne({
    where: {
      id: numericCategoryId,
      is_active: true,
    },
  });

  if (!category) {
    throw new AppError(
      "Category not found or inactive",
      404,
      "CATEGORY_NOT_FOUND"
    );
  }

  return category;
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

  const service = await Service.findOne({
    where: {
      id: numericServiceId,
      provider_id: providerId,
    },
  });

  if (!service) {
    throw new AppError(
      "Service not found",
      404,
      "SERVICE_NOT_FOUND"
    );
  }

  return service;
};

/*
|--------------------------------------------------------------------------
| Get All Services
|--------------------------------------------------------------------------
*/

const getServices = async (userId) => {
  const provider = await getProvider(userId);

  return Service.findAll({
    where: {
      provider_id: provider.id,
    },
    order: [
      ["id", "DESC"],
    ],
  });
};

/*
|--------------------------------------------------------------------------
| Get Service By ID
|--------------------------------------------------------------------------
*/

const getServiceById = async (
  userId,
  serviceId
) => {
  const provider = await getProvider(userId);

  return getOwnedService(
    provider.id,
    serviceId
  );
};

/*
|--------------------------------------------------------------------------
| Create Service
|--------------------------------------------------------------------------
*/

const createService = async (
  userId,
  data
) => {
  const provider = await getProvider(userId);

  /*
   * Validate category
   */

  await getCategory(data.category_id);

  /*
   * Create service
   *
   * provider_id comes from authenticated user.
   */

  const service = await Service.create({
    provider_id: provider.id,
    category_id: Number(data.category_id),

    name: data.name,

    description:
      data.description ?? null,

    type: data.type,

    base_price: data.base_price,

    unit: data.unit,

    attributes_json:
      data.attributes_json ?? null,

    is_active:
      data.is_active ?? true,

    image_url:
      data.image_url ?? null,
  });

  return service;
};

/*
|--------------------------------------------------------------------------
| Update Service
|--------------------------------------------------------------------------
*/

const updateService = async (
  userId,
  serviceId,
  data
) => {
  const provider = await getProvider(userId);

  const service = await getOwnedService(
    provider.id,
    serviceId
  );

  /*
   * Validate category if supplied
   */

  if (data.category_id !== undefined) {
    await getCategory(
      data.category_id
    );
  }

  const allowedFields = [
    "category_id",
    "name",
    "description",
    "type",
    "base_price",
    "unit",
    "attributes_json",
    "is_active",
    "image_url",
  ];

  const updates = {};

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updates[field] =
        data[field];
    }
  }

  if (!Object.keys(updates).length) {
    throw new AppError(
      "No fields to update",
      400,
      "NO_FIELDS_TO_UPDATE"
    );
  }

  await service.update(updates);

  return service;
};

/*
|--------------------------------------------------------------------------
| Delete Service
|--------------------------------------------------------------------------
|
| Soft delete:
| is_active = false
|
|--------------------------------------------------------------------------
*/

const deleteService = async (
  userId,
  serviceId
) => {
  const provider = await getProvider(userId);

  const service = await getOwnedService(
    provider.id,
    serviceId
  );

  await service.update({
    is_active: false,
  });

  return {
    id: service.id,
    is_active: false,
  };
};

module.exports = {
  getProviderIdByUserId,
  getProvider,
  getCategory,
  getOwnedService,
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
};