module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    "Notification",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },

      title: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },

      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      data_json: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      read_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "notifications",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          fields: ["user_id", "is_read"],
        },
      ],
    }
  );

  return Notification;
};