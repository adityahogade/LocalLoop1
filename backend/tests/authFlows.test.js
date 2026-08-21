const authService = require("../src/services/auth.service");
const { sequelize } = require("../src/config/database");

describe("authentication token lifecycle", () => {
  afterEach(() => jest.restoreAllMocks());

  test("refresh rotates the token and old token becomes unusable", async () => {
    const query = jest.spyOn(sequelize, "query");
    query.mockResolvedValueOnce([[{ id: 9, role_id: 2, status: "active", refresh_token_expires_at: new Date(Date.now() + 60000) }]])
      .mockResolvedValueOnce([[{ name: "customer" }]])
      .mockResolvedValueOnce([[]]);
    const rotated = await authService.refresh("old-token");
    expect(rotated.accessToken).toBeTruthy();
    expect(rotated.refreshToken).toHaveLength(64);
    expect(query).toHaveBeenCalledWith(expect.stringContaining("refresh_token_hash"), expect.objectContaining({ replacements: expect.objectContaining({ hash: expect.any(String) }) }));
  });

  test("expired refresh token is rejected", async () => {
    jest.spyOn(sequelize, "query").mockResolvedValueOnce([[{ id: 9, role_id: 2, status: "active", refresh_token_expires_at: new Date(Date.now() - 1000) }]]);
    await expect(authService.refresh("expired-token")).rejects.toMatchObject({ code: "INVALID_REFRESH_TOKEN", statusCode: 401 });
  });

  test("logout invalidates the stored refresh token", async () => {
    const query = jest.spyOn(sequelize, "query").mockResolvedValue([[]]);
    await authService.logout(9);
    expect(query).toHaveBeenCalledWith(expect.stringContaining("refresh_token_hash = NULL"), { replacements: { userId: 9 } });
  });

  test("password reset is single-use and invalid tokens are rejected", async () => {
    const query = jest.spyOn(sequelize, "query");
    query.mockResolvedValueOnce([[{ id: 9 }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ id: 9 }]])
      .mockResolvedValueOnce([[]]);
    const issued = await authService.requestPasswordReset("user@example.com");
    expect(issued.accepted).toBe(true);
    expect(issued.resetToken).toBeTruthy();
    await authService.resetPassword(issued.resetToken, "NewPassword@123");
    expect(query).toHaveBeenCalledWith(expect.stringContaining("password_reset_token_hash = NULL"), expect.any(Object));

    query.mockResolvedValueOnce([[]]);
    await expect(authService.resetPassword("bad-token", "NewPassword@123")).rejects.toMatchObject({ code: "INVALID_RESET_TOKEN" });
  });
});
