module.exports = (sequelize, DataTypes) => {
  const ProviderBankAccount = sequelize.define(
    "ProviderBankAccount",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      provider_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        unique: true,
      },

      account_holder_name: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },

      account_number_encrypted: {
        type: DataTypes.BLOB,
        allowNull: false,
      },

      account_number_last4: {
        type: DataTypes.CHAR(4),
        allowNull: false,
      },

      ifsc_code: {
        type: DataTypes.STRING(11),
        allowNull: false,
      },

      bank_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: "provider_bank_accounts",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return ProviderBankAccount;
};