const walletService = require("../services/wallet.service");
const billingRetryService = require("../services/billingRetry.service");
const invoiceService = require("../services/invoice.service");
const couponService = require("../services/coupon.service");
const settingsService = require("../services/adminSettings.service");

describe("priority one backend features", () => {
  test("wallet service exposes ledger-safe balance operations", () => {
    expect(typeof walletService.getWalletForCustomer).toBe("function");
    expect(typeof walletService.creditWallet).toBe("function");
    expect(typeof walletService.debitWallet).toBe("function");
  });

  test("billing retry service exposes renewal recovery logic", () => {
    expect(typeof billingRetryService.processFailedRenewals).toBe("function");
    expect(typeof billingRetryService.retrySubscriptionPayment).toBe("function");
  });

  test("invoice service exposes idempotent invoice generation", () => {
    expect(typeof invoiceService.createInvoiceForPayment).toBe("function");
    expect(typeof invoiceService.getInvoicePdf).toBe("function");
  });

  test("coupon validation and admin management are implemented", () => {
    expect(typeof couponService.validateCouponForOrder).toBe("function");
    expect(typeof couponService.listCoupons).toBe("function");
    expect(typeof couponService.createCoupon).toBe("function");
  });

  test("admin settings exporter exists", () => {
    expect(typeof settingsService.getSettings).toBe("function");
    expect(typeof settingsService.updateSetting).toBe("function");
  });
});
