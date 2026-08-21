const { PlatformSetting, AuditLog, User } = require("../models");
const AppError = require("../utils/AppError");

const safeKeys = new Set([
  "platform_name",
  "platform_email",
  "support_phone",
  "default_currency",
  "service_fee_percent",
  "max_service_distance_km",
  "auto_approve_services",
  "refund_window_days",
  "max_provider_slots",
]);

const secretKeys = new Set(["JWT_SECRET", "RAZORPAY_KEY_SECRET", "DB_PASSWORD", "DB_PASS", "SECRET_KEY"]);

const getSettings = async () => {
  const settings = await PlatformSetting.findAll({ order: [["setting_key", "ASC"]] });
  return settings.map((item) => ({
    id: item.id,
    key: item.setting_key,
    value: item.setting_value,
    description: item.description || null,
    updated_by: item.updated_by,
    updated_at: item.updated_at,
  }));
};

const getSetting = async (key) => {
  const setting = await PlatformSetting.findOne({ where: { setting_key: key } });
  if (!setting) throw new AppError("Setting not found", 404, "SETTING_NOT_FOUND");
  return setting;
};

const updateSetting = async (adminUserId, key, value, description = null) => {
  if (!key || typeof key !== "string") throw new AppError("Setting key is required", 400, "INVALID_SETTING_KEY");
  if (secretKeys.has(String(key).toUpperCase())) throw new AppError("This setting key is restricted", 400, "RESTRICTED_SETTING_KEY");
  const normalizedKey = String(key).trim();
  if (!safeKeys.has(normalizedKey) && !/^[a-z0-9_]+$/.test(normalizedKey)) {
    throw new AppError("Unsafe setting key", 400, "UNSAFE_SETTING_KEY");
  }

  const [setting] = await PlatformSetting.findOrCreate({
    where: { setting_key: normalizedKey },
    defaults: {
      setting_key: normalizedKey,
      setting_value: JSON.stringify(value),
      updated_by: adminUserId,
    },
  });

  const oldValues = { value: setting.setting_value };
  const newValue = typeof value === "string" ? value : JSON.stringify(value);
  await setting.update({ setting_value: newValue, updated_by: adminUserId });

  await AuditLog.create({
    user_id: adminUserId,
    action: "update",
    entity_type: "platform_setting",
    entity_id: setting.id,
    old_values_json: oldValues,
    new_values_json: { value: newValue },
  });

  return setting;
};

module.exports = {
  getSettings,
  getSetting,
  updateSetting,
  safeKeys,
};
