const service = require("../services/availability.service");

const get = async (req, res, next) => { try { res.json({ success: true, data: await service.listMine(req.user.id) }); } catch (error) { next(error); } };
const create = async (req, res, next) => { try { res.status(201).json({ success: true, data: await service.create(req.user.id, req.body) }); } catch (error) { next(error); } };
const update = async (req, res, next) => { try { res.json({ success: true, data: await service.update(req.user.id, req.params.id, req.body) }); } catch (error) { next(error); } };
const remove = async (req, res, next) => { try { await service.remove(req.user.id, req.params.id); res.status(204).send(); } catch (error) { next(error); } };
const slots = async (req, res, next) => { try { res.json({ success: true, data: await service.slotsForDate(req.params.providerId, req.query.date) }); } catch (error) { next(error); } };
module.exports = { get, create, update, remove, slots };
