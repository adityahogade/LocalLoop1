const { Address, Customer } = require("../models");
const AppError = require("../utils/AppError");
const owner = async (userId) => { const customer = await Customer.findOne({ where: { user_id: userId } }); if (!customer) throw new AppError("Customer profile not found", 404, "CUSTOMER_NOT_FOUND"); return customer; };
const list = async (userId) => Address.findAll({ where: { customer_id: (await owner(userId)).id }, order: [["is_default", "DESC"], ["created_at", "DESC"]] });
const create = async (userId, data) => { const customer = await owner(userId); if (data.is_default) await Address.update({ is_default: false }, { where: { customer_id: customer.id } }); const address = await Address.create({ ...data, customer_id: customer.id }); if (data.is_default) await customer.update({ default_address_id: address.id }); return address; };
const update = async (userId, id, data) => {
  const customer = await owner(userId);
  const address = await Address.findOne({ where: { id } });
  if (!address) throw new AppError("Address not found", 404, "ADDRESS_NOT_FOUND");
  if (Number(address.customer_id) !== Number(customer.id)) throw new AppError("Forbidden", 403, "FORBIDDEN");
  if (data.is_default) await Address.update({ is_default: false }, { where: { customer_id: customer.id } });
  await address.update(data);
  if (data.is_default) await customer.update({ default_address_id: address.id });
  return address;
};
const remove = async (userId, id) => {
  const customer = await owner(userId);
  const address = await Address.findOne({ where: { id } });
  if (!address) throw new AppError("Address not found", 404, "ADDRESS_NOT_FOUND");
  if (Number(address.customer_id) !== Number(customer.id)) throw new AppError("Forbidden", 403, "FORBIDDEN");
  await address.destroy();
};
module.exports = { list, create, update, remove };
