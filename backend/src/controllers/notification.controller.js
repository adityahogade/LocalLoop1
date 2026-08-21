const service = require("../services/notification.service");
const list = async (req, res, next) => { try { res.json({ success: true, data: await service.list(req.user.id) }); } catch (error) { next(error); } };
const unread = async (req, res, next) => { try { res.json({ success: true, data: { count: await service.unreadCount(req.user.id) } }); } catch (error) { next(error); } };
const read = async (req, res, next) => { try { res.json({ success: true, data: await service.markRead(req.user.id, req.params.id) }); } catch (error) { next(error); } };
const readAll = async (req, res, next) => { try { await service.markAllRead(req.user.id); res.status(204).send(); } catch (error) { next(error); } };
module.exports = { list, unread, read, readAll };
