module.exports = (sequelize, DataTypes) => sequelize.define("WebhookEvent", {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  event_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  event_type: { type: DataTypes.STRING(100), allowNull: false },
  payload_json: { type: DataTypes.JSON, allowNull: false },
  status: { type: DataTypes.ENUM("received", "processed", "failed"), allowNull: false, defaultValue: "received" },
  processed_at: { type: DataTypes.DATE, allowNull: true },
}, { tableName: "webhook_events", timestamps: true, createdAt: "created_at", updatedAt: "updated_at", indexes: [{ fields: ["event_type"] }, { fields: ["status"] }] });
