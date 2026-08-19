module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define(
    "Payment",
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

      reference_type: {
        type: DataTypes.ENUM("order", "subscription_payment"),
        allowNull: false,
      },

      reference_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },

      currency: {
        type: DataTypes.CHAR(3),
        allowNull: false,
        defaultValue: "INR",
      },

      razorpay_order_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },

      razorpay_payment_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true,
      },

      razorpay_signature: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      status: {
        type: DataTypes.ENUM(
          "created",
          "pending",
          "paid",
          "failed",
          "refunded",
          "partially_refunded"
        ),
        allowNull: false,
        defaultValue: "created",
      },

      method: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },

      idempotency_key: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },

      paid_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "payments",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          fields: ["status"],
        },
      ],
    }
  );

  return Payment;
};