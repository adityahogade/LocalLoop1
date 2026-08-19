"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("commission_rules", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      scope: {
        type: Sequelize.ENUM("global", "category", "service"),
        allowNull: false,
      },

      category_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },

      service_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },

      commission_percent: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },

      effective_from: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      effective_to: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      created_by: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex(
      "commission_rules",
      [
        "scope",
        "category_id",
        "service_id",
        "effective_from",
      ],
      {
        name: "commission_rules_scope_category_service_effective_idx",
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("commission_rules");
  },
};