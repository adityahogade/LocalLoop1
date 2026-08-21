const models = require("../src/models");
const commissionService = require("../src/services/commission.service");
const paymentService = require("../src/services/payment.service");
const billingRetryService = require("../src/services/billingRetry.service");

describe("commission rule resolution", () => {
  afterEach(() => jest.restoreAllMocks());

  test("service, category, then global precedence and active windows", async () => {
    const rules = {
      service: { id: 1, scope: "service", commission_percent: 12 },
      category: { id: 2, scope: "category", commission_percent: 10 },
      global: { id: 3, scope: "global", commission_percent: 8 },
    };
    jest.spyOn(models.CommissionRule, "findOne").mockImplementation(async ({ where }) => rules[where.scope] || null);
    await expect(commissionService.commissionPercentFor({ serviceId: 4, categoryId: 5 })).resolves.toMatchObject({ percent: 12 });

    models.CommissionRule.findOne.mockImplementation(async ({ where }) => where.scope === "category" ? rules.category : where.scope === "global" ? rules.global : null);
    await expect(commissionService.commissionPercentFor({ serviceId: 4, categoryId: 5 })).resolves.toMatchObject({ percent: 10 });

    models.CommissionRule.findOne.mockImplementation(async ({ where }) => where.scope === "global" ? rules.global : null);
    await expect(commissionService.commissionPercentFor({ serviceId: 4, categoryId: 5 })).resolves.toMatchObject({ percent: 8 });
  });

  test("inactive, future, and expired rules are excluded by the active window", () => {
    const where = commissionService.activeRuleWhere(new Date("2026-08-20T10:00:00Z"));
    expect(where.effective_from).toEqual({ [require("sequelize").Op.lte]: new Date("2026-08-20T10:00:00Z") });
    expect(where[require("sequelize").Op.or]).toHaveLength(2);
  });

  test("stores a historical commission snapshot and preserves it after rule changes", async () => {
    jest.spyOn(models.ProviderEarning, "findOne").mockResolvedValue(null);
    jest.spyOn(models.CommissionRule, "findOne").mockResolvedValue({ commission_percent: 10 });
    const create = jest.spyOn(models.ProviderEarning, "create").mockImplementation(async (values) => ({ ...values, update: jest.fn() }));
    const first = await commissionService.createProviderEarning({ providerId: 7, sourceType: "order", sourceId: 11, paymentId: 20, grossAmount: 10000, serviceId: 4, categoryId: 5 });
    models.CommissionRule.findOne.mockResolvedValue({ commission_percent: 15 });
    const second = await commissionService.createProviderEarning({ providerId: 7, sourceType: "order", sourceId: 12, paymentId: 21, grossAmount: 10000, serviceId: 4, categoryId: 5 });
    expect(first.commission_rate_applied).toBe(10);
    expect(first.commission_amount).toBe(1000);
    expect(first.net_earning).toBe(9000);
    expect(second.commission_rate_applied).toBe(15);
    expect(create).toHaveBeenCalledTimes(2);
  });

  test("refund adjusts refund_amount and net_earning without changing commission snapshot", async () => {
    const earning = { gross_amount: 10000, commission_amount: 1000, refund_amount: 0, net_earning: 9000, update: jest.fn() };
    jest.spyOn(models.ProviderEarning, "findAll").mockResolvedValue([earning]);
    await commissionService.applyRefundToEarnings(20, 500, {});
    expect(earning.update).toHaveBeenCalledWith({ refund_amount: 500, net_earning: 8500 }, { transaction: {} });
    expect(earning.commission_amount).toBe(1000);
  });
});

describe("subscription billing retry", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    paymentService.setRazorpayRequester();
  });

  test("failed renewal invokes the existing Razorpay order path", async () => {
    const subscription = { id: 9, customer_id: 10, update: jest.fn() };
    const subscriptionPayment = { id: 4, status: "failed", retry_count: 0, amount: 2500, subscription, update: jest.fn() };
    jest.spyOn(models.SubscriptionPayment, "findByPk").mockResolvedValue(subscriptionPayment);
    jest.spyOn(models.Customer, "findByPk").mockResolvedValue({ user_id: 10 });
    jest.spyOn(models.Notification, "create").mockResolvedValue({});
    const retryOrder = jest.spyOn(paymentService, "createSubscriptionRetryOrder").mockResolvedValue({ payment: { id: 30 }, retryNumber: 1, retryOrderId: "order_retry_1" });
    const result = await billingRetryService.retrySubscriptionPayment(4);
    expect(retryOrder).toHaveBeenCalledWith(4);
    expect(result).toMatchObject({ status: "retrying", retryOrderId: "order_retry_1", retries: 1 });
  });

  test("third failed retry pauses the subscription", async () => {
    const subscription = { id: 9, customer_id: 10, update: jest.fn() };
    const subscriptionPayment = { id: 4, status: "failed", retry_count: 3, subscription, update: jest.fn() };
    jest.spyOn(models.SubscriptionPayment, "findByPk").mockResolvedValue(subscriptionPayment);
    jest.spyOn(models.Customer, "findByPk").mockResolvedValue({ user_id: 10 });
    jest.spyOn(models.Notification, "create").mockResolvedValue({});
    const result = await billingRetryService.retrySubscriptionPayment(4);
    expect(subscription.update).toHaveBeenCalledWith({ status: "paused" });
    expect(result).toMatchObject({ status: "paused", retries: 3 });
  });

  test("existing retry payment is reused instead of creating a duplicate", async () => {
    const transaction = { LOCK: { UPDATE: "UPDATE" } };
    const subscription = { customer_id: 10 };
    const subscriptionPayment = { id: 4, status: "failed", retry_count: 1, amount: 2500, subscription, update: jest.fn() };
    const existing = { id: 30, status: "created" };
    jest.spyOn(models.sequelize, "transaction").mockImplementation((callback) => callback(transaction));
    jest.spyOn(models.SubscriptionPayment, "findByPk").mockResolvedValue(subscriptionPayment);
    jest.spyOn(models.Payment, "findOne").mockResolvedValue(existing);
    const result = await paymentService.createSubscriptionRetryOrder(4);
    expect(result.existing).toBe(true);
    expect(result.payment).toBe(existing);
    expect(models.Payment.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { idempotency_key: "subscription:4:retry:2" } }));
  });

  test("new retry creates a real Razorpay order and records the attempt", async () => {
    const transaction = { LOCK: { UPDATE: "UPDATE" } };
    const subscription = { customer_id: 10 };
    const subscriptionPayment = { id: 4, status: "failed", retry_count: 0, amount: 2500, subscription, update: jest.fn() };
    const create = jest.spyOn(models.Payment, "create").mockResolvedValue({ id: 31, status: "created" });
    jest.spyOn(models.sequelize, "transaction").mockImplementation((callback) => callback(transaction));
    jest.spyOn(models.SubscriptionPayment, "findByPk").mockResolvedValue(subscriptionPayment);
    jest.spyOn(models.SubscriptionPayment, "update").mockResolvedValue([1]);
    jest.spyOn(models.Payment, "findOne").mockResolvedValue(null);
    const razorpay = jest.fn().mockResolvedValue({ id: "order_retry_1" });
    paymentService.setRazorpayRequester(razorpay);
    const result = await paymentService.createSubscriptionRetryOrder(4);
    expect(razorpay).toHaveBeenCalledWith("POST", "/v1/orders", expect.objectContaining({ amount: 250000 }));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ reference_type: "subscription_payment", razorpay_order_id: "order_retry_1", status: "created" }), { transaction });
    expect(result.retryNumber).toBe(1);
  });

  test("successful retry finalization marks the subscription payment paid and restores active state", async () => {
    const subscription = { status: "paused", update: jest.fn() };
    const subscriptionPayment = { id: 4, subscription_id: 9, billing_period_end: "2026-08-31", subscription, update: jest.fn() };
    jest.spyOn(models.SubscriptionPayment, "findByPk").mockResolvedValue(subscriptionPayment);
    jest.spyOn(commissionService, "recordEarningForPayment").mockResolvedValue({ id: 40 });
    const result = await paymentService.finalizeSuccessfulPayment({ id: 31, reference_type: "subscription_payment", reference_id: 4, amount: 2500 }, { LOCK: { UPDATE: "UPDATE" } });
    expect(subscriptionPayment.update).toHaveBeenCalledWith(expect.objectContaining({ status: "paid", payment_id: 31 }), expect.any(Object));
    expect(subscription.update).toHaveBeenCalledWith(expect.objectContaining({ status: "active" }), expect.any(Object));
    expect(result).toEqual({ id: 40 });
  });
});
