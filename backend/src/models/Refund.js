module.exports = (sequelize, DataTypes) => {
  const Refund = sequelize.define(
    "Refund",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      payment_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },

      reason: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM(
          "requested",
          "processing",
          "processed",
          "failed"
        ),
        allowNull: false,
        defaultValue: "requested",
      },

      razorpay_refund_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true,
      },

      processed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "refunds",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          fields: ["payment_id"],
        },
        {
          fields: ["status"],
        },
      ],
    }
  );

  return Refund;
};