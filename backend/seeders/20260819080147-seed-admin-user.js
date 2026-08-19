"use strict";

const { hashPassword } = require("../src/utils/password");

const ADMIN_EMAIL = "servicehub055@gmail.com";
const ADMIN_PHONE = "9689781971";

module.exports = {
  async up(queryInterface) {
    const [roles] = await queryInterface.sequelize.query(
      "SELECT id FROM roles WHERE name = 'admin' LIMIT 1"
    );

    if (!roles.length) {
      throw new Error(
        "Admin role not found. Run the roles seed first."
      );
    }

    const adminRoleId = roles[0].id;

    const [existingUsers] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = '${ADMIN_EMAIL}' LIMIT 1`
    );

    if (existingUsers.length) {
      console.log("Admin user already exists. Skipping seed.");
      return;
    }

    const passwordHash = await hashPassword(
      "ServiceHub@123"
    );

    const now = new Date();

    await queryInterface.bulkInsert("users", [
      {
        role_id: adminRoleId,
        full_name: "ServiceHub Administrator",
        email: ADMIN_EMAIL,
        phone: ADMIN_PHONE,
        password_hash: passwordHash,
        status: "active",
        last_login_at: null,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("users", {
      email: ADMIN_EMAIL,
    });
  },
};