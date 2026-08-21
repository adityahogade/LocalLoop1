jest.mock("../src/models", () => ({
  Review: { findByPk: jest.fn(), findOne: jest.fn() },
  Provider: { findOne: jest.fn() },
  Customer: { findOne: jest.fn() },
  CustomerSubscription: { findOne: jest.fn() },
  ServicePlan: { findByPk: jest.fn() },
  SubscriptionPayment: { findOne: jest.fn(), create: jest.fn() },
  Notification: { findOne: jest.fn(), create: jest.fn() },
  AuditLog: { create: jest.fn() },
  sequelize: { transaction: jest.fn((work) => work({ LOCK: { UPDATE: "UPDATE" } })) },
}));

const reviewService = require("../src/services/review.service");
const subscriptionService = require("../src/services/subscription.service");
const { Review, Provider, Customer, CustomerSubscription, ServicePlan, SubscriptionPayment, Notification, AuditLog } = require("../src/models");

describe("review ownership and moderation", () => {
  beforeEach(() => jest.clearAllMocks());

  test("the owning provider reply persists both reply fields", async () => {
    const review = { id: 71, provider_id: 9, update: jest.fn() };
    Provider.findOne.mockResolvedValue({ id: 9 });
    Review.findByPk.mockResolvedValue(review);

    await expect(reviewService.reply(22, 71, "Thanks for the feedback")).resolves.toBe(review);
    expect(review.update).toHaveBeenCalledWith(expect.objectContaining({ provider_reply: "Thanks for the feedback", provider_replied_at: expect.any(Date) }));
  });

  test("a different provider is explicitly forbidden and unknown reviews remain 404", async () => {
    Provider.findOne.mockResolvedValue({ id: 10 });
    Review.findByPk.mockResolvedValueOnce({ id: 71, provider_id: 9 });
    await expect(reviewService.reply(23, 71, "Nope")).rejects.toMatchObject({ statusCode: 403, code: "FORBIDDEN" });
    Review.findByPk.mockResolvedValueOnce(null);
    await expect(reviewService.reply(23, 999, "Nope")).rejects.toMatchObject({ statusCode: 404, code: "REVIEW_NOT_FOUND" });
  });

  test("moderation persists the state transition and its audit snapshot", async () => {
    const review = { id: 71, is_visible: true, moderation_status: "visible", update: jest.fn(async (values) => Object.assign(review, values)) };
    Review.findOne.mockResolvedValue(review);

    await reviewService.moderate(1, 71, false);
    expect(review.update).toHaveBeenCalledWith({ is_visible: false, moderation_status: "hidden" });
    expect(AuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ user_id: 1, action: "review.moderated", entity_id: 71, old_values_json: { is_visible: true }, new_values_json: { is_visible: false, moderation_status: "hidden" } }));
  });
});

describe("subscription renewal safety", () => {
  beforeEach(() => jest.clearAllMocks());

  const ownedSubscription = (overrides = {}) => ({
    id: 55,
    customer_id: 10,
    service_plan_id: 7,
    quantity: 2,
    start_date: "2026-07-01",
    status: "active",
    update: jest.fn(),
    ...overrides,
  });

  const arrangeOwned = (subscription) => {
    Customer.findOne.mockResolvedValue({ id: 10 });
    CustomerSubscription.findOne.mockResolvedValue(subscription);
  };

  test("rejects non-renewable subscriptions and unavailable plans", async () => {
    arrangeOwned(ownedSubscription({ status: "paused" }));
    await expect(subscriptionService.renew(22, 55)).rejects.toMatchObject({ statusCode: 409, code: "SUBSCRIPTION_NOT_RENEWABLE" });

    arrangeOwned(ownedSubscription());
    ServicePlan.findByPk.mockResolvedValue({ is_active: false });
    await expect(subscriptionService.renew(22, 55)).rejects.toMatchObject({ statusCode: 409, code: "PLAN_NOT_AVAILABLE" });
  });

  test("returns the existing pending renewal instead of duplicating its billing period", async () => {
    arrangeOwned(ownedSubscription());
    ServicePlan.findByPk.mockResolvedValue({ is_active: true, price: 100, billing_cycle_days: 30 });
    const existing = { id: 9, billing_period_start: "2026-08-01", status: "pending" };
    SubscriptionPayment.findOne.mockResolvedValue(existing);

    await expect(subscriptionService.renew(22, 55)).resolves.toBe(existing);
    expect(SubscriptionPayment.create).not.toHaveBeenCalled();
  });

  test("creates one calculated billing period, advances billing, and notifies the owner", async () => {
    const subscription = ownedSubscription();
    arrangeOwned(subscription);
    ServicePlan.findByPk.mockResolvedValue({ is_active: true, price: 100, billing_cycle_days: 30 });
    SubscriptionPayment.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ billing_period_end: "2026-07-30" })
      .mockResolvedValueOnce(null);
    SubscriptionPayment.create.mockResolvedValue({ id: 17 });
    Notification.findOne.mockResolvedValue(null);

    await subscriptionService.renew(22, 55);
    expect(SubscriptionPayment.create).toHaveBeenCalledWith(expect.objectContaining({ subscription_id: 55, billing_period_start: "2026-07-31", billing_period_end: "2026-08-29", amount: 200 }), expect.any(Object));
    expect(subscription.update).toHaveBeenCalledWith({ next_billing_date: "2026-08-29" }, expect.any(Object));
    expect(Notification.create).toHaveBeenCalledWith(expect.objectContaining({ user_id: 22, reference_type: "subscription_payment", reference_id: 17 }), expect.any(Object));
  });

  test("propagates a notification failure so Sequelize rolls the renewal transaction back", async () => {
    const subscription = ownedSubscription();
    arrangeOwned(subscription);
    ServicePlan.findByPk.mockResolvedValue({ is_active: true, price: 100, billing_cycle_days: 30 });
    SubscriptionPayment.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ billing_period_end: "2026-07-30" }).mockResolvedValueOnce(null);
    SubscriptionPayment.create.mockResolvedValue({ id: 17 });
    Notification.findOne.mockRejectedValue(new Error("notification write failed"));

    await expect(subscriptionService.renew(22, 55)).rejects.toThrow("notification write failed");
  });
});
