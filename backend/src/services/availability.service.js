const { Op } = require("sequelize");
const { ProviderAvailability, Provider, sequelize } = require("../models");
const AppError = require("../utils/AppError");

const assertTimeRange = (start, end) => {
  if (start >= end) throw new AppError("Availability end time must be after start time", 400, "INVALID_TIME_RANGE");
};

const getProvider = async (userId) => {
  const provider = await Provider.findOne({ where: { user_id: userId, is_active: true } });
  if (!provider) throw new AppError("Provider profile not found", 404, "PROVIDER_NOT_FOUND");
  return provider;
};

const listMine = async (userId) => {
  const provider = await getProvider(userId);
  return ProviderAvailability.findAll({ where: { provider_id: provider.id }, order: [["day_of_week", "ASC"], ["start_time", "ASC"]] });
};

const create = async (userId, data) => {
  const provider = await getProvider(userId);
  assertTimeRange(data.start_time, data.end_time);
  const duplicate = await ProviderAvailability.findOne({ where: { provider_id: provider.id, day_of_week: data.day_of_week, start_time: data.start_time, end_time: data.end_time } });
  if (duplicate) throw new AppError("This availability slot already exists", 409, "DUPLICATE_AVAILABILITY");
  return ProviderAvailability.create({ ...data, provider_id: provider.id });
};

const update = async (userId, id, data) => {
  const provider = await getProvider(userId);
  const slot = await ProviderAvailability.findOne({ where: { id, provider_id: provider.id } });
  if (!slot) throw new AppError("Availability slot not found", 404, "AVAILABILITY_NOT_FOUND");
  assertTimeRange(data.start_time || slot.start_time, data.end_time || slot.end_time);
  await slot.update(data);
  return slot;
};

const remove = async (userId, id) => {
  const provider = await getProvider(userId);
  const deleted = await ProviderAvailability.destroy({ where: { id, provider_id: provider.id } });
  if (!deleted) throw new AppError("Availability slot not found", 404, "AVAILABILITY_NOT_FOUND");
};

const slotsForDate = async (providerId, date) => {
  const day = new Date(`${date}T00:00:00`).getDay();
  return ProviderAvailability.findAll({ where: { provider_id: providerId, day_of_week: day, is_available: true }, order: [["start_time", "ASC"]] });
};

module.exports = { listMine, create, update, remove, slotsForDate };
