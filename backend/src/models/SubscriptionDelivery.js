module.exports = (sequelize, DataTypes) => {
  const SubscriptionDelivery = sequelize.define(
    "SubscriptionDelivery",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      subscription_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      delivery_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM(
          "scheduled",
          "ready",
          "out_for_delivery",
          "delivered",
          "skipped",
          "cancelled"
        ),
        allowNull: false,
        defaultValue: "scheduled",
      },

      quantity: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: false,
      },

      delivered_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      delivery_slot: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      notes: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      otp_code: {
        type: DataTypes.STRING(6),
        allowNull: true,
      },
    },
    {
      tableName: "subscription_deliveries",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          fields: ["subscription_id", "delivery_date"],
        },
        {
          fields: ["delivery_date", "status"],
        },
      ],
    }
  );

  return SubscriptionDelivery;
};