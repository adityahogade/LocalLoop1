module.exports = (sequelize, DataTypes) => {
  const SubscriptionPayment = sequelize.define(
    "SubscriptionPayment",
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

      billing_period_start: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      billing_period_end: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      payment_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },

      status: {
        type: DataTypes.ENUM(
          "pending",
          "paid",
          "failed",
          "retrying"
        ),
        allowNull: false,
        defaultValue: "pending",
      },

      due_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      retry_count: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: "subscription_payments",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          fields: ["subscription_id"],
        },
        {
          unique: true,
          fields: ["subscription_id", "billing_period_start"],
        },
        {
          fields: ["status"],
        },
      ],
    }
  );

  return SubscriptionPayment;
};