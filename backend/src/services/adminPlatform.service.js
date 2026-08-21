const { Op } = require("sequelize");
const { sequelize, Category, User, Customer, Provider, Service, ServiceArea, Order, Payment, Refund, SupportTicket, Review, CustomerSubscription, SubscriptionDelivery, AuditLog, CommissionRule, ProviderEarning, ProviderSettlement, ProviderExpense } = require("../models");
const AppError = require("../utils/AppError");
const listCategories = () => Category.findAll({ order: [["name", "ASC"]] });
const createCategory = (data) => Category.create(data);
const updateCategory = async (id, data) => { const category = await Category.findByPk(id); if (!category) throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND"); await category.update(data); return category; };
const deleteCategory = async (id) => { const category = await Category.findByPk(id); if (!category) throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND"); const used = await Service.count({ where: { category_id: id } }); if (used) throw new AppError("Category is in use and cannot be deleted", 409, "CATEGORY_IN_USE"); await category.update({ is_active: false }); };
const stats = async () => ({ users: await User.count(), providers: await Provider.count(), activeServices: await Service.count({ where: { is_active: true } }), orders: await Order.count(), paidPayments: await Payment.count({ where: { status: "paid" } }), openTickets: await SupportTicket.count({ where: { status: { [Op.in]: ["open", "in_progress"] } } }), activeSubscriptions: await CustomerSubscription.count({ where: { status: "active" } }), reviews: await Review.count() });
const listServices = () => Service.findAll({ include: [{ model: Provider, as: "provider", attributes: ["id", "business_name"] }], order: [["created_at", "DESC"]] });
const moderateService = async (adminUserId, serviceId, isActive) => {
	const service = await Service.findByPk(serviceId);
	if (!service) throw new AppError("Service not found", 404, "SERVICE_NOT_FOUND");
	const oldValue = service.is_active;
	await service.update({ is_active: Boolean(isActive) });
	await AuditLog.create({ user_id: adminUserId, action: Boolean(isActive) ? "approve_service" : "deactivate_service", entity_type: "service", entity_id: service.id, old_values_json: { is_active: oldValue }, new_values_json: { is_active: service.is_active } });
	return service;
};
const listServiceAreas = () => ServiceArea.findAll({ include: [{ model: Provider, as: "provider", attributes: ["id", "business_name"] }], order: [["id", "DESC"]] });
const updateServiceArea = async (adminUserId, id, data) => {
	const area = await ServiceArea.findByPk(id);
	if (!area) throw new AppError("Service area not found", 404, "SERVICE_AREA_NOT_FOUND");
	const oldValues = area.toJSON();
	await area.update(data);
	await AuditLog.create({ user_id: adminUserId, action: "update_service_area", entity_type: "service_area", entity_id: area.id, old_values_json: oldValues, new_values_json: area.toJSON() });
	return area;
};
const reports = async () => ({
	revenue: (await Payment.sum("amount", { where: { status: "paid" } })) || 0,
	refunds: (await Refund.sum("amount", { where: { status: { [Op.in]: ["processed", "processing"] } } })) || 0,
	commissions: (await ProviderEarning.sum("commission_amount")) || 0,
	settlements: { requested: await ProviderSettlement.count({ where: { status: "requested" } }), paid: await ProviderSettlement.count({ where: { status: "paid" } }) },
	providerPerformance: await ProviderEarning.findAll({ attributes: ["provider_id", [sequelize.fn("SUM", sequelize.col("net_earning")), "net_earning"]], group: ["provider_id"], order: [["net_earning", "DESC"]], raw: true }),
});
const listAuditLogs = (query = {}) => AuditLog.findAndCountAll({ where: query, order: [["created_at", "DESC"]], limit: 50 });
const listCommissionRules = () => CommissionRule.findAll({ order: [["effective_from", "DESC"]] });
const commissionScopeWhere = (data) => ({ scope: data.scope, category_id: data.scope === "category" ? data.category_id : null, service_id: data.scope === "service" ? data.service_id : null });
const createCommissionRule = async (adminUserId, data) => sequelize.transaction(async (transaction) => {
	const effectiveFrom = new Date(data.effective_from);
	const where = commissionScopeWhere(data);
	const current = await CommissionRule.findOne({ where: { ...where, effective_to: null }, order: [["effective_from", "DESC"]], transaction, lock: transaction.LOCK.UPDATE });
	if (current && new Date(current.effective_from) <= effectiveFrom) await current.update({ effective_to: effectiveFrom }, { transaction });
	const rule = await CommissionRule.create({ ...data, ...where, created_by: adminUserId }, { transaction });
	await AuditLog.create({ user_id: adminUserId, action: "commission.created", entity_type: "commission_rule", entity_id: rule.id, new_values_json: rule.toJSON() }, { transaction });
	return rule;
});
const updateCommissionRule = async (adminUserId, id, data) => sequelize.transaction(async (transaction) => {
	const rule = await CommissionRule.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
	if (!rule) throw new AppError("Commission rule not found", 404, "COMMISSION_RULE_NOT_FOUND");
	const oldValues = rule.toJSON();
	const effectiveFrom = new Date(data.effective_from || new Date());
	const next = { scope: data.scope || rule.scope, category_id: data.category_id ?? rule.category_id, service_id: data.service_id ?? rule.service_id, commission_percent: data.commission_percent ?? rule.commission_percent, effective_from: effectiveFrom, effective_to: data.effective_to ?? null, created_by: rule.created_by };
	await rule.update({ effective_to: effectiveFrom }, { transaction });
	const replacement = await CommissionRule.create(next, { transaction });
	await AuditLog.create({ user_id: adminUserId, action: "commission.updated", entity_type: "commission_rule", entity_id: replacement.id, old_values_json: oldValues, new_values_json: replacement.toJSON() }, { transaction });
	return replacement;
});
const dateWhere = (query, field = "created_at") => {
	if (!query.from && !query.to) return {};
	return { [field]: { ...(query.from ? { [Op.gte]: query.from } : {}), ...(query.to ? { [Op.lte]: query.to } : {}) } };
};
const page = (query) => ({ limit: Math.min(Number(query.limit || 50), 100), offset: (Math.max(Number(query.page || 1), 1) - 1) * Math.min(Number(query.limit || 50), 100) });
const monitoring = async (kind, query = {}) => {
	const options = { ...page(query), order: [["created_at", "DESC"]], where: { ...dateWhere(query) } };
	if (query.status) options.where.status = query.status;
	if (kind === "orders") {
		options.include = [{ model: Customer, as: "customer", attributes: ["id", "user_id"] }, { model: Provider, as: "provider", attributes: ["id", "business_name"] }];
		return Order.findAndCountAll(options);
	}
	if (kind === "subscriptions") {
		options.include = [{ model: Customer, as: "customer", attributes: ["id", "user_id"] }, { model: Provider, as: "provider", attributes: ["id", "business_name"] }, { model: Service, as: "service", attributes: ["id", "name"] }];
		return CustomerSubscription.findAndCountAll(options);
	}
	options.include = [{ model: CustomerSubscription, as: "subscription", attributes: ["id", "customer_id", "provider_id"], include: [{ model: Provider, as: "provider", attributes: ["id", "business_name"] }] }];
	return SubscriptionDelivery.findAndCountAll(options);
};
const reportRows = async (family, query = {}) => {
	const where = dateWhere(query);
	if (family === "revenue") return Payment.findAll({ attributes: [[sequelize.fn("DATE", sequelize.col("created_at")), "date"], [sequelize.fn("SUM", sequelize.col("amount")), "amount"]], where: { ...where, status: "paid" }, group: [sequelize.fn("DATE", sequelize.col("created_at"))], raw: true });
	if (family === "orders") return Order.findAll({ attributes: ["status", [sequelize.fn("COUNT", sequelize.col("id")), "count"]], where, group: ["status"], raw: true });
	if (family === "providers") return Provider.findAll({ attributes: ["id", "business_name", "kyc_status", "is_active", "average_rating"], raw: true });
	if (family === "customers") return Customer.findAll({ attributes: ["id", "user_id", "created_at"], where, raw: true });
	if (family === "subscriptions") return CustomerSubscription.findAll({ attributes: ["status", [sequelize.fn("COUNT", sequelize.col("id")), "count"]], where, group: ["status"], raw: true });
	if (family === "expenses") return ProviderExpense.findAll({ attributes: ["category", [sequelize.fn("SUM", sequelize.col("amount")), "amount"]], where: dateWhere(query, "expense_date"), group: ["category"], raw: true });
	throw new AppError("Report family not found", 404, "REPORT_NOT_FOUND");
};
module.exports = { listCategories, createCategory, updateCategory, deleteCategory, stats, listServices, moderateService, listServiceAreas, updateServiceArea, reports, listAuditLogs, listCommissionRules, createCommissionRule, updateCommissionRule, monitoring, reportRows };
