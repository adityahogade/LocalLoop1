module.exports = {
  async up(queryInterface, Sequelize) {
    const addIndexIfMissing = async (tableName, fields, options = {}) => {
      const indexes = await queryInterface.showIndex(tableName);
      const exists = indexes.some((index) => JSON.stringify(index.fields.map((field) => field.attribute || field)) === JSON.stringify(fields));
      if (!exists) await queryInterface.addIndex(tableName, fields, options);
    };

    await addIndexIfMissing("service_areas", ["provider_id", "pincode"], { unique: true, name: "service_areas_provider_pincode_unique" });
    await addIndexIfMissing("subscription_payments", ["status", "due_date"], { name: "subscription_payments_retry_lookup" });
    await addIndexIfMissing("audit_logs", ["entity_type", "created_at"], { name: "audit_logs_entity_created_at" });
    await addIndexIfMissing("provider_earnings", ["provider_id", "settlement_id"], { name: "provider_earnings_settlement_lookup" });
  },

  async down(queryInterface) {
    for (const [tableName, indexName] of [
      ["service_areas", "service_areas_provider_pincode_unique"],
      ["subscription_payments", "subscription_payments_retry_lookup"],
      ["audit_logs", "audit_logs_entity_created_at"],
      ["provider_earnings", "provider_earnings_settlement_lookup"],
    ]) {
      try {
        await queryInterface.removeIndex(tableName, indexName);
      } catch (error) {
        if (error.name !== "SequelizeUnknownConstraintError") throw error;
      }
    }
  },
};
