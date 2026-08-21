module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define(
    "Order",
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

      address_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      order_number: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
      },

      status: {
        type: DataTypes.ENUM(
          "pending",
          "confirmed",
          "in_progress",
          "completed",
          "cancelled"
        ),
        allowNull: false,
        defaultValue: "pending",
      },

      subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },

      discount_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },

      total_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },

      scheduled_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },

      category_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      scheduled_time_slot: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },

      booking_details_json: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      payment_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },

      cancelled_reason: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: "orders",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          fields: ["customer_id", "status"],
        },
        {
          fields: ["provider_id", "status"],
        },
        {
          fields: ["type", "status"],
        },
      ],
    }
  );

  return Order;
};