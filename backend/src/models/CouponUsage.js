module.exports = (sequelize, DataTypes) => {
  const CouponUsage = sequelize.define(
    "CouponUsage",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      coupon_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      customer_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      order_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },

      discount_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },

      used_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "coupon_usage",
      timestamps: false,
      indexes: [
        {
          fields: ["coupon_id", "customer_id"],
        },
        {
          fields: ["customer_id"],
        },
        {
          fields: ["order_id"],
        },
      ],
    }
  );

  return CouponUsage;
};