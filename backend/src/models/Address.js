module.exports = (sequelize, DataTypes) => {
  const Address = sequelize.define(
    "Address",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      customer_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      label: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },

      house_no: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      building: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      street: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },

      area: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      city: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      state: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      pincode: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },

      latitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },

      longitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },

      is_default: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: "addresses",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          fields: ["customer_id"],
        },
        {
          fields: ["pincode"],
        },
      ],
    }
  );

  return Address;
};