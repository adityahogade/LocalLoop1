"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.addConstraint("commission_rules", {
      fields: ["category_id"],
      type: "foreign key",
      name: "fk_commission_rules_category",
      references: {
        table: "categories",
        field: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    await queryInterface.addConstraint("commission_rules", {
      fields: ["service_id"],
      type: "foreign key",
      name: "fk_commission_rules_service",
      references: {
        table: "services",
        field: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    await queryInterface.addConstraint("commission_rules", {
      fields: ["created_by"],
      type: "foreign key",
      name: "fk_commission_rules_created_by",
      references: {
        table: "users",
        field: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint(
      "commission_rules",
      "fk_commission_rules_created_by"
    );

    await queryInterface.removeConstraint(
      "commission_rules",
      "fk_commission_rules_service"
    );

    await queryInterface.removeConstraint(
      "commission_rules",
      "fk_commission_rules_category"
    );
  },
};