module.exports = (sequelize, DataTypes) => {
  const CustomerSubscription = sequelize.define(
    "CustomerSubscription",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      customer_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      provider_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      service_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      service_plan_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      address_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      quantity: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: false,
      },

      delivery_time_slot: {
        type: DataTypes.ENUM(
          "morning",
          "evening",
          "custom"
        ),
        allowNull: false,
      },

      custom_time: {
        type: DataTypes.TIME,
        allowNull: true,
      },

      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },

      status: {
        type: DataTypes.ENUM(
          "active",
          "paused",
          "vacation",
          "cancelled",
          "expired"
        ),
        allowNull: false,
        defaultValue: "active",
      },

      vacation_start: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },

      vacation_end: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },

      next_billing_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
    },
    {
      tableName: "customer_subscriptions",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          fields: ["status", "next_billing_date"],
        },
        {
          fields: ["customer_id", "status"],
        },
        {
          fields: ["provider_id"],
        },
      ],
    }
  );

  return CustomerSubscription;
};