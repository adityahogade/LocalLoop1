jest.mock("../src/config/database", () => ({ sequelize: { query: jest.fn() } }));
jest.mock("../src/models", () => ({
  Coupon: { create: jest.fn(), findByPk: jest.fn() },
  CouponUsage: {}, Customer: {}, Category: {}, Order: {},
  AuditLog: { create: jest.fn() },
}));

const { sequelize } = require("../src/config/database");
const { Coupon, AuditLog } = require("../src/models");
const couponService = require("../src/services/coupon.service");
const userService = require("../src/services/user.service");

describe("required administrative audit mutations", () => {
  beforeEach(() => jest.clearAllMocks());

  test("coupon create and update write snapshots through the real coupon service", async () => {
    const coupon = { id: 44, code: "WELCOME", toJSON: jest.fn(() => ({ id: 44, code: "WELCOME", discount_value: 10 })), update: jest.fn() };
    Coupon.create.mockResolvedValue(coupon);
    await couponService.createCoupon(1, { code: "welcome", discount_type: "flat", discount_value: 10, valid_from: "2026-01-01", valid_until: "2026-12-31" });
    expect(Coupon.create).toHaveBeenCalledWith(expect.objectContaining({ created_by: 1 }));
    expect(AuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ user_id: 1, action: "coupon.created", entity_type: "coupon", entity_id: 44, new_values_json: expect.objectContaining({ code: "WELCOME" }) }));

    Coupon.findByPk.mockResolvedValue(coupon);
    await couponService.updateCoupon(1, 44, { discount_value: 20 });
    expect(AuditLog.create).toHaveBeenLastCalledWith(expect.objectContaining({ user_id: 1, action: "coupon.updated", entity_type: "coupon", entity_id: 44, old_values_json: expect.any(Object), new_values_json: expect.any(Object) }));
  });

  test("user suspension writes old and new status through the real user service", async () => {
    sequelize.query
      .mockResolvedValueOnce([[{ id: 7, status: "active" }]])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([[{ id: 7, status: "suspended" }]]);

    await userService.updateUserStatus(1, 7, "suspended");
    expect(AuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ user_id: 1, action: "user.status_updated", entity_type: "user", entity_id: 7, old_values_json: { status: "active" }, new_values_json: { status: "suspended" } }));
  });
});
