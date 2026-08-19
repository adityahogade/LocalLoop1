module.exports = (sequelize, DataTypes) => {
  const PlatformSetting = sequelize.define(
    "PlatformSetting",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      setting_key: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },

      setting_value: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      updated_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
    },
    {
      tableName: "platform_settings",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          fields: ["updated_by"],
        },
      ],
    }
  );

  return PlatformSetting;
};