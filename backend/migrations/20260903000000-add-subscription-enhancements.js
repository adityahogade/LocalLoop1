"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. service_plans
    const planCols = await queryInterface.describeTable("service_plans");
    if (!planCols.deliveries_per_day) {
      await queryInterface.addColumn("service_plans", "deliveries_per_day", {
        type: Sequelize.SMALLINT.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
      });
    }
    if (!planCols.discount_percent) {
      await queryInterface.addColumn("service_plans", "discount_percent", {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00,
      });
    }

    // 2. customer_subscriptions
    const subCols = await queryInterface.describeTable("customer_subscriptions");
    if (!subCols.delivery_slots) {
      await queryInterface.addColumn("customer_subscriptions", "delivery_slots", {
        type: Sequelize.JSON,
        allowNull: true,
      });
    }

    // 3. subscription_deliveries
    const delivCols = await queryInterface.describeTable("subscription_deliveries");
    if (!delivCols.delivery_slot) {
      await queryInterface.addColumn("subscription_deliveries", "delivery_slot", {
        type: Sequelize.STRING(50),
        allowNull: true,
      });
    }

    // Drop unique index on (subscription_id, delivery_date) if present to support multiple daily deliveries
    try {
      await queryInterface.removeIndex("subscription_deliveries", ["subscription_id", "delivery_date"]);
    } catch (e) {
      // index may already have been altered or not named as array
    }
  },

  async down(queryInterface) {
    const planCols = await queryInterface.describeTable("service_plans");
    if (planCols.discount_percent) await queryInterface.removeColumn("service_plans", "discount_percent");
    if (planCols.deliveries_per_day) await queryInterface.removeColumn("service_plans", "deliveries_per_day");

    const subCols = await queryInterface.describeTable("customer_subscriptions");
    if (subCols.delivery_slots) await queryInterface.removeColumn("customer_subscriptions", "delivery_slots");

    const delivCols = await queryInterface.describeTable("subscription_deliveries");
    if (delivCols.delivery_slot) await queryInterface.removeColumn("subscription_deliveries", "delivery_slot");
  },
};
