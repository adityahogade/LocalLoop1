module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define(
    "AuditLog",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },

      action: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      entity_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },

      entity_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      old_values_json: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      new_values_json: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
    },
    {
      tableName: "audit_logs",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
      indexes: [
        {
          fields: ["entity_type", "entity_id"],
        },
        {
          fields: ["user_id", "created_at"],
        },
      ],
    }
  );

  return AuditLog;
};