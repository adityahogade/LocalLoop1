module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable("users");
    if (!columns.refresh_token_expires_at) await queryInterface.addColumn("users", "refresh_token_expires_at", { type: Sequelize.DATE, allowNull: true });
    if (!columns.password_reset_token_hash) await queryInterface.addColumn("users", "password_reset_token_hash", { type: Sequelize.STRING(255), allowNull: true });
    if (!columns.password_reset_expires_at) await queryInterface.addColumn("users", "password_reset_expires_at", { type: Sequelize.DATE, allowNull: true });
  },
  async down(queryInterface) {
    const columns = await queryInterface.describeTable("users");
    if (columns.password_reset_expires_at) await queryInterface.removeColumn("users", "password_reset_expires_at");
    if (columns.password_reset_token_hash) await queryInterface.removeColumn("users", "password_reset_token_hash");
    if (columns.refresh_token_expires_at) await queryInterface.removeColumn("users", "refresh_token_expires_at");
  },
};
