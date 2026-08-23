const { Op } = require("sequelize");
const { sequelize, Customer, Provider, Address, Service, Order, OrderItem, ProviderAvailability } = require("../models");
const AppError = require("../utils/AppError");
const notifications = require("./notification.service");

const customerFor = (userId) => Customer.findOne({ where: { user_id: userId } });
const providerFor = (userId) => Provider.findOne({ where: { user_id: userId } });
const ensureCustomer = async (userId) => { const value = await customerFor(userId); if (!value) throw new AppError("Customer profile not found", 404, "CUSTOMER_NOT_FOUND"); return value; };
const ensureProvider = async (userId) => { const value = await providerFor(userId); if (!value) throw new AppError("Provider profile not found", 404, "PROVIDER_NOT_FOUND"); return value; };
const orderInclude = [{ model: OrderItem, as: "items", include: [{ model: Service, as: "service" }] }, { model: Address, as: "address" }];

const validateSlot = async (providerId, date, time, transaction) => {
  const day = new Date(`${date}T00:00:00`).getDay();
  const slots = await ProviderAvailability.findAll({ where: { provider_id: providerId, day_of_week: day, is_available: true }, transaction });
  const matching = slots.find((slot) => slot.start_time <= time && slot.end_time > time);
  if (!matching) throw new AppError("Provider is not available at the requested time", 409, "SLOT_UNAVAILABLE");
  const active = await Order.count({ where: { provider_id: providerId, scheduled_date: date, scheduled_time_slot: time, status: { [Op.in]: ["pending", "confirmed", "in_progress"] } }, transaction, lock: transaction.LOCK.UPDATE });
  if (active >= matching.max_bookings_per_slot) throw new AppError("The requested slot is already fully booked", 409, "SLOT_FULL");
};

const create = async (userId, data) => {
  const customer = await ensureCustomer(userId);
  return sequelize.transaction(async (transaction) => {
    const provider = await Provider.findOne({ where: { id: data.provider_id, is_active: true }, transaction });
    if (!provider) throw new AppError("Provider not found or inactive", 404, "PROVIDER_NOT_FOUND");
    const address = await Address.findOne({ where: { id: data.address_id, customer_id: customer.id }, transaction });
    if (!address) throw new AppError("Address not found", 404, "ADDRESS_NOT_FOUND");
    const area = await require("../models").ServiceArea.findOne({ where: { provider_id: provider.id, pincode: address.pincode }, transaction });
    if (!area) throw new AppError("Provider does not serve this address", 409, "SERVICE_AREA_UNAVAILABLE");
    const services = await Service.findAll({ where: { id: { [Op.in]: data.items.map((item) => item.service_id) }, provider_id: provider.id, is_active: true }, transaction });
    if (services.length !== data.items.length) throw new AppError("One or more services are invalid for this provider", 400, "INVALID_SERVICE");
    await validateSlot(provider.id, data.scheduled_date, data.scheduled_time, transaction);
    const byId = new Map(services.map((service) => [String(service.id), service]));
    const items = data.items.map((item) => { const service = byId.get(String(item.service_id)); const unit = Number(service.base_price); return { service_id: service.id, quantity: item.quantity, unit_price: unit, line_total: unit * item.quantity }; });
    const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
    const order = await Order.create({ customer_id: customer.id, provider_id: provider.id, address_id: address.id, category_id: services[0].category_id, order_number: `LL-${Date.now()}-${Math.floor(Math.random() * 1000)}`, scheduled_date: data.scheduled_date, scheduled_time_slot: data.scheduled_time, booking_details_json: data.notes ? { notes: data.notes, type: data.type } : { type: data.type }, subtotal, total_amount: subtotal, discount_amount: 0 }, { transaction });
    await OrderItem.bulkCreate(items.map((item) => ({ ...item, order_id: order.id })), { transaction });
    await notifications.createOnce({ user_id: userId, type: "order_confirmed", title: "Order created", body: "Your order has been created and is awaiting confirmation.", reference_type: "order", reference_id: order.id, transaction });
    return Order.findByPk(order.id, { include: orderInclude, transaction });
  });
};

const list = async (userId, roleId) => { const where = Number(roleId) === 3 ? { provider_id: (await ensureProvider(userId)).id } : { customer_id: (await ensureCustomer(userId)).id }; return Order.findAll({ where, include: orderInclude, order: [["created_at", "DESC"]] }); };
const get = async (userId, roleId, id) => {
  const order = await Order.findOne({ where: { id }, include: orderInclude });
  if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");

  if (Number(roleId) === 2) {
    const activeCustomerId = Number((await ensureCustomer(userId)).id);
    if (Number(order.customer_id) !== activeCustomerId) throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  if (Number(roleId) === 3) {
    const activeProviderId = Number((await ensureProvider(userId)).id);
    if (Number(order.provider_id) !== activeProviderId) throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  return order;
};
const updateStatus = async (userId, roleId, id, status) => { const order = await get(userId, roleId, id); const transitions = { pending: ["confirmed", "cancelled"], confirmed: ["in_progress", "cancelled"], in_progress: ["completed"], completed: [], cancelled: [] }; if (!transitions[order.status].includes(status)) throw new AppError(`Cannot change order from ${order.status} to ${status}`, 409, "INVALID_ORDER_TRANSITION"); if (Number(roleId) === 2 && !["cancelled"].includes(status)) throw new AppError("Customers can only cancel orders", 403, "FORBIDDEN"); await order.update({ status }); if (status === "confirmed") { const customer = await Customer.findByPk(order.customer_id, { attributes: ["user_id"] }); await notifications.createOnce({ user_id: customer.user_id, type: "order_confirmed", title: "Order confirmed", body: "Your provider has confirmed the order.", reference_type: "order", reference_id: order.id }); } return order; };
module.exports = { create, list, get, updateStatus };
