module.exports = (sequelize, DataTypes) => {
  const Service = sequelize.define(
    "Service",
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

      category_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      type: {
        type: DataTypes.ENUM("subscription", "one_time", "both"),
        allowNull: false,
      },

      base_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      unit: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },

      attributes_json: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      image_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: "services",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          fields: ["provider_id", "category_id", "is_active"],
        },
      ],
    }
  );

  return Service;
};