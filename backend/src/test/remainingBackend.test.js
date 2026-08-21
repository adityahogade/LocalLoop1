const crypto = require("crypto");
const paymentService = require("../services/payment.service");
const AppError = require("../utils/AppError");

describe("remaining backend validation", () => {
  test("invalid webhook signatures are rejected before database work", async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = "test-secret";
    const body = Buffer.from(JSON.stringify({ id: "evt_1", event: "payment.captured" }));
    await expect(paymentService.webhook(body, "invalid", "evt_1")).rejects.toMatchObject({ code: "INVALID_WEBHOOK_SIGNATURE" });
  });

  test("invalid payment signatures are rejected as AppError", () => {
    const error = new AppError("Payment signature is invalid", 400, "INVALID_PAYMENT_SIGNATURE");
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("INVALID_PAYMENT_SIGNATURE");
  });
});
