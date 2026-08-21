const service = require("../services/address.service");
const list = async (req, res, next) => { try { res.json({ success: true, data: await service.list(req.user.id) }); } catch (error) { next(error); } };
const create = async (req, res, next) => { try { res.status(201).json({ success: true, data: await service.create(req.user.id, req.body) }); } catch (error) { next(error); } };
const update = async (req, res, next) => { try { res.json({ success: true, data: await service.update(req.user.id, req.params.id, req.body) }); } catch (error) { next(error); } };
const remove = async (req, res, next) => { try { await service.remove(req.user.id, req.params.id); res.status(204).send(); } catch (error) { next(error); } };
module.exports = { list, create, update, remove };
