module.exports = (sequelize, DataTypes) => {
  const CommissionRule = sequelize.define(
    "CommissionRule",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      scope: {
        type: DataTypes.ENUM("global", "category", "service"),
        allowNull: false,
      },

      category_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },

      service_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },

      commission_percent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },

      effective_from: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      effective_to: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      created_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
    },
    {
      tableName: "commission_rules",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          fields: [
            "scope",
            "category_id",
            "service_id",
            "effective_from",
          ],
        },
      ],
    }
  );

  return CommissionRule;
};