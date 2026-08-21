const service = require("../services/order.service");
const create = async (req, res, next) => { try { res.status(201).json({ success: true, data: await service.create(req.user.id, req.body) }); } catch (error) { next(error); } };
const list = async (req, res, next) => { try { res.json({ success: true, data: await service.list(req.user.id, req.user.roleId) }); } catch (error) { next(error); } };
const get = async (req, res, next) => { try { res.json({ success: true, data: await service.get(req.user.id, req.user.roleId, req.params.id) }); } catch (error) { next(error); } };
const status = async (req, res, next) => { try { res.json({ success: true, data: await service.updateStatus(req.user.id, req.user.roleId, req.params.id, req.body.status) }); } catch (error) { next(error); } };
module.exports = { create, list, get, status };
