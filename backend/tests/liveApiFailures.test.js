jest.mock("../src/config/database", () => ({ sequelize: { query: jest.fn() } }));
jest.mock("../src/utils/password", () => ({ hashPassword: jest.fn(), comparePassword: jest.fn() }));
jest.mock("../src/utils/jwt", () => ({ generateAccessToken: jest.fn(() => "access-token") }));
jest.mock("../src/models", () => ({
  Provider: { findByPk: jest.fn() },
  Review: { findAll: jest.fn() },
  SupportTicket: { create: jest.fn(), findOne: jest.fn() },
  SupportMessage: { create: jest.fn() },
}));

const { sequelize } = require("../src/config/database");
const { comparePassword } = require("../src/utils/password");
const authService = require("../src/services/auth.service");
const userService = require("../src/services/user.service");
const reviewService = require("../src/services/review.service");
const supportService = require("../src/services/support.service");
const { Provider, Review, SupportTicket, SupportMessage } = require("../src/models");

describe("live API failure regressions", () => {
  beforeEach(() => jest.clearAllMocks());

  test("login rejects unknown emails and invalid passwords with the same 401 contract", async () => {
    sequelize.query.mockResolvedValueOnce([[]]);
    await expect(authService.login("unknown@example.com", "password")).rejects.toMatchObject({ statusCode: 401, code: "INVALID_CREDENTIALS" });

    sequelize.query.mockResolvedValueOnce([[{ id: 1, role_id: 2, role_name: "customer", status: "active", password_hash: "hash" }]]);
    comparePassword.mockResolvedValueOnce(false);
    await expect(authService.login("known@example.com", "wrong-password")).rejects.toMatchObject({ statusCode: 401, code: "INVALID_CREDENTIALS" });
  });

  test("deleting an unknown user returns a controlled 404", async () => {
    sequelize.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    await expect(userService.deleteUser(999999999)).rejects.toMatchObject({ statusCode: 404, code: "USER_NOT_FOUND" });
  });

  test("review listing rejects a nonexistent provider without a 500", async () => {
    Provider.findByPk.mockResolvedValueOnce(null);
    await expect(reviewService.list(999999999)).rejects.toMatchObject({ statusCode: 404, code: "PROVIDER_NOT_FOUND" });
  });

  test("ticket owner can add a message using the ID returned at creation", async () => {
    const ticket = { id: 42, status: "open" };
    SupportTicket.create.mockResolvedValueOnce(ticket);
    SupportMessage.create
      .mockResolvedValueOnce({ id: 1 })
      .mockResolvedValueOnce({ id: 2 });
    SupportTicket.findOne.mockResolvedValue({ ...ticket, messages: [] });

    const created = await supportService.create(7, { subject: "Help", category: "other", message: "First" });
    const message = await supportService.addMessage(7, 2, created.id, { message: "Second" });

    expect(created.id).toBe(42);
    expect(message).toEqual({ id: 2 });
    expect(SupportMessage.create).toHaveBeenLastCalledWith(expect.objectContaining({ ticket_id: 42, sender_id: 7, message: "Second" }));
  });

  test("review list remains empty for an existing provider with no reviews", async () => {
    Provider.findByPk.mockResolvedValueOnce({ id: 5 });
    Review.findAll.mockResolvedValueOnce([]);
    await expect(reviewService.list(5)).resolves.toEqual([]);
  });
});
