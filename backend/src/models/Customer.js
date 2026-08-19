module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define(
    "Customer",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        unique: true,
      },

      default_address_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },

      date_of_birth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },

      referral_code: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: true,
      },
    },
    {
      tableName: "customers",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Customer;
};