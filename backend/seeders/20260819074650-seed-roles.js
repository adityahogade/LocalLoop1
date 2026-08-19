"use strict";

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert("roles", [
      {
        name: "admin",
        description: "System administrator",
        created_at: now,
        updated_at: now,
      },
      {
        name: "customer",
        description: "Service customer",
        created_at: now,
        updated_at: now,
      },
      {
        name: "provider",
        description: "Service provider",
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("roles", {
      name: ["admin", "customer", "provider"],
    });
  },
};