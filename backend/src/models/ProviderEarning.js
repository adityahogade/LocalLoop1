module.exports = (sequelize, DataTypes) => {
  const ProviderEarning = sequelize.define(
    "ProviderEarning",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      provider_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      source_type: {
        type: DataTypes.ENUM("order", "subscription_delivery"),
        allowNull: false,
      },

      source_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      payment_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      gross_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },

      commission_rate_applied: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },

      commission_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },

      refund_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },

      net_earning: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },

      earning_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      settlement_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
    },
    {
      tableName: "provider_earnings",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
      indexes: [
        {
          fields: ["provider_id", "earning_date"],
        },
        {
          fields: ["settlement_id"],
        },
      ],
    }
  );

  return ProviderEarning;
};