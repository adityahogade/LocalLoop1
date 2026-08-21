module.exports = {
  async up(queryInterface) {
    const [duplicates] = await queryInterface.sequelize.query(`
      SELECT source_type, source_id, payment_id, COUNT(*) AS duplicate_count
      FROM provider_earnings
      GROUP BY source_type, source_id, payment_id
      HAVING COUNT(*) > 1
    `);
    if (duplicates.length) throw new Error("Cannot add provider earnings idempotency index while duplicate ledger rows exist");
    const indexes = await queryInterface.showIndex("provider_earnings");
    const exists = indexes.some((index) => index.unique && JSON.stringify(index.fields.map((field) => field.attribute || field)) === JSON.stringify(["source_type", "source_id", "payment_id"]));
    if (!exists) await queryInterface.addIndex("provider_earnings", ["source_type", "source_id", "payment_id"], { unique: true, name: "provider_earnings_source_payment_unique" });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("provider_earnings", "provider_earnings_source_payment_unique");
  },
};
