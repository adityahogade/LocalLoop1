const fs = require("fs");
const os = require("os");
const path = require("path");
const models = require("../src/models");
const { hasValidSignature } = require("../src/midleware/kycUpload");
const billingJob = require("../src/jobs/subscriptionBillingJob");
const subscriptionService = require("../src/services/subscription.service");

const tempFile = (name, bytes) => { const file = path.join(os.tmpdir(), `servicehub-${Date.now()}-${Math.random().toString(16).slice(2)}-${name}`); fs.writeFileSync(file, bytes); return file; };

describe("KYC upload and subscription lifecycle", () => {
  afterEach(() => jest.restoreAllMocks());

  test("accepts valid PDF signatures and rejects invalid, unsupported, and truncated files", async () => {
    const valid = tempFile("document.pdf", Buffer.from("%PDF-1.7 test"));
    const invalid = tempFile("document.pdf", Buffer.from("not-a-pdf"));
    const unsupported = tempFile("document.txt", Buffer.from("%PDF-1.7 test"));
    const truncated = tempFile("document.pdf", Buffer.from("%PD"));
    await expect(hasValidSignature({ path: valid, originalname: "document.pdf" })).resolves.toBe(true);
    await expect(hasValidSignature({ path: invalid, originalname: "document.pdf" })).resolves.toBe(false);
    await expect(hasValidSignature({ path: unsupported, originalname: "document.txt" })).resolves.toBe(false);
    await expect(hasValidSignature({ path: truncated, originalname: "document.pdf" })).resolves.toBe(false);
    [valid, invalid, unsupported, truncated].forEach((file) => fs.unlinkSync(file));
  });

  test("expires eligible subscriptions idempotently", async () => {
    const update = jest.spyOn(models.CustomerSubscription, "update").mockResolvedValue([2]);
    await expect(billingJob.expireSubscriptions("2026-08-20", {})).resolves.toBe(2);
    expect(update).toHaveBeenCalledWith({ status: "expired" }, expect.objectContaining({ where: expect.objectContaining({ end_date: expect.any(Object) }) }));
  });

  test("delivery completion is provider-owned and creates earnings through shared service", async () => {
    const delivery = { id: 3, subscription_id: 4, status: "out_for_delivery", subscription: { provider_id: 7, service_id: 8, service_plan_id: 9 }, update: jest.fn() };
    jest.spyOn(models.SubscriptionDelivery, "findByPk").mockResolvedValue(delivery);
    jest.spyOn(models.SubscriptionPayment, "findOne").mockResolvedValue({ payment_id: 22 });
    jest.spyOn(models.Payment, "findByPk").mockResolvedValue({ id: 22, amount: 1000 });
    jest.spyOn(models.ServicePlan, "findByPk").mockResolvedValue({ price: 1000 });
    jest.spyOn(models.Service, "findByPk").mockResolvedValue({ category_id: 5 });
    const earning = jest.spyOn(require("../src/services/commission.service"), "createProviderEarning").mockResolvedValue({ id: 99 });
    const transaction = jest.spyOn(models.sequelize, "transaction").mockImplementation((callback) => callback({ LOCK: { UPDATE: "UPDATE" } }));
    await subscriptionService.updateDeliveryStatus(7, 3, "delivered");
    expect(delivery.update).toHaveBeenCalledWith(expect.objectContaining({ status: "delivered" }), expect.any(Object));
    expect(earning).toHaveBeenCalledWith(expect.objectContaining({ sourceType: "subscription_delivery", sourceId: 3, paymentId: 22, transaction: expect.any(Object) }));
    expect(transaction).toHaveBeenCalled();
  });

  test("scheduler creates a delivery and its idempotent scheduled notification", async () => {
    const subscription = { id: 44, customer_id: 12, provider_id: 7, quantity: 2, address: { pincode: "411001" } };
    const delivery = { id: 81 };
    jest.spyOn(models.CustomerSubscription, "findAll").mockResolvedValue([subscription]);
    jest.spyOn(models.SkippedDelivery, "findOne").mockResolvedValue(null);
    jest.spyOn(models.ServiceArea, "findOne").mockResolvedValue({ id: 1 });
    jest.spyOn(models.SubscriptionDelivery, "findOrCreate").mockResolvedValue([delivery, true]);
    jest.spyOn(models.Customer, "findByPk").mockResolvedValue({ user_id: 12 });
    jest.spyOn(models.sequelize, "transaction").mockImplementation((callback) => callback({}));
    const createOnce = jest.spyOn(require("../src/services/notification.service"), "createOnce").mockResolvedValue({ id: 1 });

    await expect(require("../src/jobs/subscriptionDeliveryJob").run("2026-08-21")).resolves.toMatchObject({ created: 1, failures: [] });
    expect(createOnce).toHaveBeenCalledWith(expect.objectContaining({ user_id: 12, type: "delivery_scheduled", reference_type: "subscription_delivery", reference_id: 81 }));
  });
});
