module.exports = (sequelize, DataTypes) => {
  const WalletTransaction = sequelize.define(
    "WalletTransaction",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      wallet_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      type: {
        type: DataTypes.ENUM("credit", "debit", "refund"),
        allowNull: false,
      },

      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },

      balance_after: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },

      reference_type: {
        type: DataTypes.ENUM(
          "order",
          "subscription_payment",
          "refund",
          "manual_admin_adjustment"
        ),
        allowNull: false,
      },

      reference_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },

      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: "wallet_transactions",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
      indexes: [
        {
          fields: ["wallet_id", "created_at"],
        },
      ],
    }
  );

  return WalletTransaction;
};