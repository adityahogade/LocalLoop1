const { Notification } = require("../models");
const AppError = require("../utils/AppError");

const list = (userId) => Notification.findAll({ where: { user_id: userId }, order: [["created_at", "DESC"]] });
const unreadCount = (userId) => Notification.count({ where: { user_id: userId, is_read: false } });
const markRead = async (userId, id) => { const notification = await Notification.findOne({ where: { id, user_id: userId } }); if (!notification) throw new AppError("Notification not found", 404, "NOTIFICATION_NOT_FOUND"); await notification.update({ is_read: true }); return notification; };
const markAllRead = async (userId) => { await Notification.update({ is_read: true }, { where: { user_id: userId, is_read: false } }); };
const createOnce = async ({ user_id, type, title, body, reference_type = null, reference_id = null, transaction = undefined }) => {
  const where = { user_id, type, reference_type, reference_id };
  const existing = await Notification.findOne({ where, transaction });
  if (existing) return existing;
  return Notification.create({ user_id, type, title, body, reference_type, reference_id }, { transaction });
};
module.exports = { list, unreadCount, markRead, markAllRead, createOnce };
