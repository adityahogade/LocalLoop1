module.exports = (sequelize, DataTypes) => {
  const SkippedDelivery = sequelize.define(
    "SkippedDelivery",
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

      skip_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      reason: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: "skipped_deliveries",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
      indexes: [
        {
          unique: true,
          fields: ["subscription_id", "skip_date"],
        },
      ],
    }
  );

  return SkippedDelivery;
};