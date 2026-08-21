module.exports = {
  async up(queryInterface, Sequelize) {
    const [admins] = await queryInterface.sequelize.query("SELECT id FROM users WHERE role_id = 1 ORDER BY id ASC LIMIT 1");
    const adminId = admins[0]?.id;
    if (!adminId) return;

    await queryInterface.bulkInsert("platform_settings", [
      { key: "default_currency", value: "INR", updated_by: adminId, updated_at: new Date() },
      { key: "service_fee_percent", value: "0", updated_by: adminId, updated_at: new Date() },
      { key: "auto_approve_services", value: "false", updated_by: adminId, updated_at: new Date() },
    ], { updateOnDuplicate: ["value", "updated_by", "updated_at"] });

    const [rules] = await queryInterface.sequelize.query("SELECT id FROM commission_rules WHERE scope = 'global' LIMIT 1");
    if (!rules.length) {
      await queryInterface.bulkInsert("commission_rules", [{
        scope: "global",
        category_id: null,
        service_id: null,
        commission_percent: 0,
        effective_from: new Date(),
        effective_to: null,
        created_by: adminId,
        created_at: new Date(),
        updated_at: new Date(),
      }], {});
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("platform_settings", { key: ["default_currency", "service_fee_percent", "auto_approve_services"] });
    await queryInterface.bulkDelete("commission_rules", { scope: "global", commission_percent: 0 });
  },
};
