module.exports = (sequelize, DataTypes) => {
  const ProviderExpense = sequelize.define(
    "ProviderExpense",
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

      category: {
        type: DataTypes.ENUM(
          "fuel",
          "ingredients",
          "raw_materials",
          "cleaning_supplies",
          "staff_salary",
          "maintenance",
          "packaging",
          "transportation",
          "other"
        ),
        allowNull: false,
      },

      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },

      expense_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      receipt_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: "provider_expenses",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          fields: ["provider_id", "expense_date"],
        },
      ],
    }
  );

  return ProviderExpense;
};