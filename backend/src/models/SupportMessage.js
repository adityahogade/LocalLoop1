module.exports = (sequelize, DataTypes) => {
  const SupportMessage = sequelize.define(
    "SupportMessage",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      ticket_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      sender_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      attachment_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: "support_messages",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
      indexes: [
        {
          fields: ["ticket_id"],
        },
      ],
    }
  );

  return SupportMessage;
};