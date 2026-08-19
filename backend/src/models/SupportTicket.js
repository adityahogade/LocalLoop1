module.exports = (sequelize, DataTypes) => {
  const SupportTicket = sequelize.define(
    "SupportTicket",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      ticket_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },

      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      subject: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },

      category: {
        type: DataTypes.ENUM(
          "order",
          "subscription",
          "payment",
          "kyc",
          "other"
        ),
        allowNull: false,
      },

      priority: {
        type: DataTypes.ENUM("low", "medium", "high"),
        allowNull: false,
        defaultValue: "medium",
      },

      status: {
        type: DataTypes.ENUM(
          "open",
          "in_progress",
          "resolved",
          "closed"
        ),
        allowNull: false,
        defaultValue: "open",
      },
    },
    {
      tableName: "support_tickets",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          fields: ["user_id"],
        },
        {
          fields: ["status"],
        },
      ],
    }
  );

  return SupportTicket;
};