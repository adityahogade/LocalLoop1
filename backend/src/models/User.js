module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      role_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      full_name: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },

      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
      },

      phone: {
        type: DataTypes.STRING(15),
        allowNull: false,
        unique: true,
      },

      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      preferred_language: {
        type: DataTypes.ENUM("en", "hi", "mr"),
        allowNull: false,
        defaultValue: "en",
      },

      status: {
        type: DataTypes.ENUM(
          "active",
          "suspended",
          "deleted"
        ),
        allowNull: false,
        defaultValue: "active",
      },

      email_verified_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      phone_verified_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      refresh_token_hash: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      last_login_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "users",

      timestamps: true,

      createdAt: "created_at",
      updatedAt: "updated_at",

      indexes: [
        {
          fields: ["role_id"],
        },
        {
          fields: ["status"],
        },
      ],
    }
  );

  return User;
};