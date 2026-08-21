"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable("reviews");
    if (!columns.moderation_status) await queryInterface.addColumn("reviews", "moderation_status", { type: Sequelize.ENUM("visible", "hidden"), allowNull: false, defaultValue: "visible" });
  },
  async down(queryInterface) {
    const columns = await queryInterface.describeTable("reviews");
    if (columns.moderation_status) await queryInterface.removeColumn("reviews", "moderation_status");
  },
};
