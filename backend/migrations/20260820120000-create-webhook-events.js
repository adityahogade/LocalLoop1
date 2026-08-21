module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("webhook_events", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
      event_id: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      event_type: { type: Sequelize.STRING(100), allowNull: false },
      payload_json: { type: Sequelize.JSON, allowNull: false },
      status: { type: Sequelize.ENUM("received", "processed", "failed"), allowNull: false, defaultValue: "received" },
      processed_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") },
    });
    await queryInterface.addIndex("webhook_events", ["event_type"]);
    await queryInterface.addIndex("webhook_events", ["status"]);
  },
  async down(queryInterface) {
    await queryInterface.dropTable("webhook_events");
  },
};
