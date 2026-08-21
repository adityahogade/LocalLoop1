module.exports = (sequelize, DataTypes) => {
  const ServicePlan = sequelize.define(
    "ServicePlan",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      service_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      frequency: {
        type: DataTypes.ENUM(
          "daily",
          "weekly",
          "monthly"
        ),
        allowNull: false,
      },

      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      min_quantity: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: false,
        defaultValue: 1,
      },

      billing_cycle_days: {
        type: DataTypes.SMALLINT.UNSIGNED,
        allowNull: true,
      },

      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: "service_plans",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",

      indexes: [
        {
          fields: ["service_id"],
        },
        {
          fields: ["is_active"],
        },
      ],
    }
  );

  return ServicePlan;
};