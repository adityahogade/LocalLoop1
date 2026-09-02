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
const listPayments = async (query = {}) => {
  const where = { ...dateWhere(query) };
  if (query.status && query.status !== "all") {
    where.status = query.status;
  }

  const allPayments = await Payment.findAll({
    where,
    order: [["created_at", "DESC"], ["id", "DESC"]]
  });

  const detailedPayments = [];

  for (const p of allPayments) {
    let customerName = "Customer";
    let customerEmail = "";
    let customerPhone = "";
    let providerId = null;
    let providerName = "Provider";
    let providerBusiness = "Provider Store";
    let providerEmail = "";
    let providerPhone = "";
    let serviceId = null;
    let serviceName = "Service";
    let serviceType = p.reference_type === "order" ? "one_time" : "subscription";
    let planFrequency = "One-Time";
    let quantity = 1;
    let unit = "unit";
    let subscriptionId = null;
    let orderNumber = null;
    let baseProviderPrice = 0;

    // 1. Fetch Customer Info
    if (p.customer_id) {
      try {
        const customer = await Customer.findByPk(p.customer_id, {
          include: [{ model: User, as: "user", attributes: ["full_name", "email", "phone"] }]
        });
        if (customer?.user) {
          customerName = customer.user.full_name || "Customer";
          customerEmail = customer.user.email || "";
          customerPhone = customer.user.phone || "";
        }
      } catch (err) {}
    }

    // 2. Fetch Reference Info (SubscriptionPayment or Order)
    if (p.reference_type === "subscription_payment" && p.reference_id) {
      try {
        const { ServicePlan } = require("../models");
        const subPayment = await require("../models").SubscriptionPayment.findByPk(p.reference_id, {
          include: [{
            model: CustomerSubscription,
            as: "subscription",
            include: [
              { model: Service, as: "service", attributes: ["id", "name", "type", "unit", "base_price"] },
              { model: ServicePlan, as: "servicePlan", attributes: ["id", "frequency", "price"] },
              { model: Provider, as: "provider", include: [{ model: User, as: "user", attributes: ["full_name", "email", "phone"] }] }
            ]
          }]
        });

        if (subPayment?.subscription) {
          const sub = subPayment.subscription;
          subscriptionId = sub.id;
          quantity = Number(sub.quantity || 1);
          if (sub.service) {
            serviceId = sub.service.id;
            serviceName = sub.service.name;
            serviceType = sub.service.type || "subscription";
            unit = sub.service.unit || "unit";
          }
          if (sub.servicePlan) {
            planFrequency = sub.servicePlan.frequency || "monthly";
            baseProviderPrice = Number(sub.servicePlan.price || 0) * quantity;
          } else if (sub.service) {
            baseProviderPrice = Number(sub.service.base_price || 0) * quantity;
          }
          if (sub.provider) {
            providerId = sub.provider.id;
            providerBusiness = sub.provider.business_name || "Provider Store";
            providerName = sub.provider.user?.full_name || "Provider";
            providerEmail = sub.provider.user?.email || "";
            providerPhone = sub.provider.user?.phone || "";
          }
        }
      } catch (err) {}
    } else if (p.reference_type === "order" && p.reference_id) {
      try {
        const order = await Order.findByPk(p.reference_id, {
          include: [
            { model: Provider, as: "provider", include: [{ model: User, as: "user", attributes: ["full_name", "email", "phone"] }] },
            { model: require("../models").OrderItem, as: "items", include: [{ model: Service, as: "service" }] }
          ]
        });

        if (order) {
          orderNumber = order.order_number || String(order.id);
          baseProviderPrice = Number(order.subtotal || 0);
          quantity = Number(order.items?.[0]?.quantity || 1);
          if (order.items?.[0]?.service) {
            serviceId = order.items[0].service.id;
            serviceName = order.items[0].service.name;
            serviceType = "one_time";
            unit = order.items[0].service.unit || "unit";
          }
          if (order.provider) {
            providerId = order.provider.id;
            providerBusiness = order.provider.business_name || "Provider Store";
            providerName = order.provider.user?.full_name || "Provider";
            providerEmail = order.provider.user?.email || "";
            providerPhone = order.provider.user?.phone || "";
          }
        }
      } catch (err) {}
    }

    // 3. Resolve ProviderEarning and Settlement Status
    let commissionPercent = 10;
    let commissionAmount = 0;
    let providerAmount = baseProviderPrice || Number(p.amount);
    let customerPaid = Number(p.amount || 0);
    let settlementStatus = p.status === "paid" ? "PENDING" : "NOT_ELIGIBLE";
    let settlementId = null;
    let settlementDate = null;
    let payoutReference = null;

    try {
      let earning = await ProviderEarning.findOne({
        where: { payment_id: p.id }
      });

      if (!earning && p.status === "paid") {
        try {
          earning = await require("./commission.service").recordEarningForPayment(p);
        } catch (e) {}
      }

      if (earning) {
        commissionPercent = Number(earning.commission_rate_applied || 10);
        commissionAmount = Number(earning.commission_amount || 0);
        providerAmount = Number(earning.net_earning || 0);
        customerPaid = Number(earning.gross_amount || p.amount);

        if (earning.settlement_id) {
          settlementStatus = "PAID";
          settlementId = earning.settlement_id;
          const settlement = await ProviderSettlement.findByPk(earning.settlement_id);
          if (settlement) {
            settlementDate = settlement.processed_at;
            payoutReference = settlement.payout_reference;
          }
        } else {
          settlementStatus = "PENDING";
        }
      } else {
        if (p.status === "paid") {
          const { percent } = await require("./commission.service").commissionPercentFor({ serviceId, categoryId: null });
          commissionPercent = percent || 10;
          if (!baseProviderPrice) {
            baseProviderPrice = Math.round((customerPaid / (1 + commissionPercent / 100)) * 100) / 100;
          }
          providerAmount = baseProviderPrice;
          commissionAmount = Number((customerPaid - providerAmount).toFixed(2));
          settlementStatus = "PENDING";
        } else {
          settlementStatus = "NOT_ELIGIBLE";
          const { percent } = await require("./commission.service").commissionPercentFor({ serviceId, categoryId: null });
          commissionPercent = percent || 10;
          if (!baseProviderPrice) {
            baseProviderPrice = Math.round((customerPaid / (1 + commissionPercent / 100)) * 100) / 100;
          }
          providerAmount = baseProviderPrice;
          commissionAmount = Number((customerPaid - providerAmount).toFixed(2));
        }
      }
    } catch (err) {}

    detailedPayments.push({
      id: p.id,
      amount: customerPaid.toFixed(2),
      currency: p.currency || "INR",
      status: p.status,
      method: p.method || "razorpay",
      paid_at: p.paid_at,
      created_at: p.created_at,
      reference_type: p.reference_type,
      reference_id: p.reference_id,
      subscription_id: subscriptionId,
      order_number: orderNumber,
      customer: {
        id: p.customer_id,
        name: customerName,
        email: customerEmail,
        phone: customerPhone
      },
      provider: {
        id: providerId,
        name: providerName,
        business_name: providerBusiness,
        email: providerEmail,
        phone: providerPhone
      },
      service: {
        id: serviceId,
        name: serviceName,
        type: serviceType,
        plan_frequency: planFrequency,
        quantity,
        unit
      },
      pricing: {
        provider_amount: providerAmount.toFixed(2),
        commission_percent: commissionPercent.toFixed(2),
        commission_amount: commissionAmount.toFixed(2),
        customer_paid: customerPaid.toFixed(2)
      },
      settlement: {
        status: settlementStatus,
        settlement_id: settlementId,
        settlement_date: settlementDate,
        payout_reference: payoutReference
      }
    });
  }

  // Calculate summary KPIs from actual payments
  let totalPaymentsAmount = 0;
  let customerRevenue = 0;
  let providerPayable = 0;
  let platformCommission = 0;
  let settlementPending = 0;
  let settlementPaid = 0;

  for (const item of detailedPayments) {
    const custPaid = Number(item.pricing.customer_paid || 0);
    const provAmt = Number(item.pricing.provider_amount || 0);
    const commAmt = Number(item.pricing.commission_amount || 0);

    totalPaymentsAmount += custPaid;

    if (item.status === "paid") {
      customerRevenue += custPaid;
      providerPayable += provAmt;
      platformCommission += commAmt;

      if (item.settlement.status === "PAID") {
        settlementPaid += provAmt;
      } else {
        settlementPending += provAmt;
      }
    }
  }

  return {
    summary: {
      total_payments_count: detailedPayments.length,
      total_payments_amount: totalPaymentsAmount.toFixed(2),
      customer_revenue: customerRevenue.toFixed(2),
      provider_payable: providerPayable.toFixed(2),
      platform_commission: platformCommission.toFixed(2),
      settlement_pending: settlementPending.toFixed(2),
      settlement_paid: settlementPaid.toFixed(2)
    },
    payments: detailedPayments
  };
};

module.exports = { listCategories, createCategory, updateCategory, deleteCategory, stats, listServices, moderateService, listServiceAreas, updateServiceArea, reports, listAuditLogs, listCommissionRules, createCommissionRule, updateCommissionRule, monitoring, reportRows, listPayments };
