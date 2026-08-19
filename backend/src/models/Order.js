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

      type: {
        type: DataTypes.ENUM("cleaning", "water"),
        allowNull: false,
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

      tax_amount: {
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

      scheduled_time: {
        type: DataTypes.TIME,
        allowNull: true,
      },

      notes: {
        type: DataTypes.TEXT,
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
          fields: ["customer_id", "created_at"],
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