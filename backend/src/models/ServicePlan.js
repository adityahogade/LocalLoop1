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

      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },

      billing_cycle: {
        type: DataTypes.ENUM(
          "daily",
          "weekly",
          "monthly",
          "quarterly",
          "yearly"
        ),
        allowNull: false,
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