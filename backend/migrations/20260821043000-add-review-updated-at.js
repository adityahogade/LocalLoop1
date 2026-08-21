"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable("reviews");
    if (!columns.updated_at) await queryInterface.addColumn("reviews", "updated_at", { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"), onUpdate: "CURRENT_TIMESTAMP" });
  },
  async down(queryInterface) {
    const columns = await queryInterface.describeTable("reviews");
    if (columns.updated_at) await queryInterface.removeColumn("reviews", "updated_at");
  },
};
