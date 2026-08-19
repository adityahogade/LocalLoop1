module.exports = (sequelize, DataTypes) => {
  const ServiceArea = sequelize.define(
    "ServiceArea",
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

      state: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      city: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      area: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      pincode: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
    },
    {
      tableName: "service_areas",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          unique: true,
          fields: ["provider_id", "pincode"],
        },
        {
          fields: ["pincode"],
        },
      ],
    }
  );

  return ServiceArea;
};