const { User, Customer, Address } = require("../models");
const AppError = require("../utils/AppError");

const getProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ["password_hash", "refresh_token_hash"] },
    include: [{ model: Customer, as: "customer", include: [{ model: Address, as: "addresses" }] }],
  });
  if (!user || !user.customer) throw new AppError("Customer profile not found", 404, "CUSTOMER_NOT_FOUND");
  return user;
};

const updateProfile = async (userId, data) => {
  const customer = await Customer.findOne({ where: { user_id: userId } });
  const user = await User.findByPk(userId);
  if (!customer || !user) throw new AppError("Customer profile not found", 404, "CUSTOMER_NOT_FOUND");
  if (data.default_address_id !== undefined) {
    const address = await Address.findOne({ where: { id: data.default_address_id, customer_id: customer.id } });
    if (!address) throw new AppError("Address not found", 404, "ADDRESS_NOT_FOUND");
  }
  const userFields = ["full_name", "phone", "preferred_language"];
  const customerFields = ["date_of_birth", "default_address_id"];
  await user.update(Object.fromEntries(Object.entries(data).filter(([key]) => userFields.includes(key))));
  await customer.update(Object.fromEntries(Object.entries(data).filter(([key]) => customerFields.includes(key))));
  return getProfile(userId);
};

module.exports = { getProfile, updateProfile };
