"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable("reviews");
    if (!columns.order_id) await queryInterface.addColumn("reviews", "order_id", { type: Sequelize.BIGINT.UNSIGNED, allowNull: true, unique: true });
    if (!columns.is_visible) await queryInterface.addColumn("reviews", "is_visible", { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true });
  },
  async down(queryInterface) {
    const columns = await queryInterface.describeTable("reviews");
    if (columns.is_visible) await queryInterface.removeColumn("reviews", "is_visible");
    if (columns.order_id) await queryInterface.removeColumn("reviews", "order_id");
  },
};
