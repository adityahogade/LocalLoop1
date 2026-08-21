"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable("reviews");
    if (!columns.provider_reply) await queryInterface.addColumn("reviews", "provider_reply", { type: Sequelize.TEXT, allowNull: true });
    if (!columns.provider_replied_at) await queryInterface.addColumn("reviews", "provider_replied_at", { type: Sequelize.DATE, allowNull: true });
  },
  async down(queryInterface) {
    const columns = await queryInterface.describeTable("reviews");
    if (columns.provider_replied_at) await queryInterface.removeColumn("reviews", "provider_replied_at");
    if (columns.provider_reply) await queryInterface.removeColumn("reviews", "provider_reply");
  },
};
