module.exports = (sequelize, DataTypes) => {
  const ProviderSettlement = sequelize.define(
    "ProviderSettlement",
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

      period_start: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      period_end: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      total_earnings: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM(
          "requested",
          "approved",
          "paid",
          "rejected"
        ),
        allowNull: false,
        defaultValue: "requested",
      },

      requested_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      processed_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },

      processed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      payout_reference: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      rejection_reason: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: "provider_settlements",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          fields: ["provider_id"],
        },
        {
          fields: ["status"],
        },
      ],
    }
  );

  return ProviderSettlement;
};