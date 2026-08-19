module.exports = (sequelize, DataTypes) => {
  const Coupon = sequelize.define(
    "Coupon",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      code: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
      },

      discount_type: {
        type: DataTypes.ENUM("percentage", "fixed"),
        allowNull: false,
      },

      discount_value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      min_order_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },

      max_discount_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },

      valid_from: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      valid_until: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      usage_limit: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },

      usage_count: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },

      per_customer_limit: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },

      category_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },

      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: "coupons",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          fields: ["is_active", "valid_from", "valid_until"],
        },
        {
          fields: ["category_id"],
        },
      ],
    }
  );

  return Coupon;
};