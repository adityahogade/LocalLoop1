const service = require("../services/review.service");
const create = async (req, res, next) => { try { res.status(201).json({ success: true, data: await service.create(req.user.id, req.body) }); } catch (error) { next(error); } };
const list = async (req, res, next) => { try { res.json({ success: true, data: await service.list(req.params.providerId) }); } catch (error) { next(error); } };
const reply = async (req, res, next) => { try { res.json({ success: true, data: await service.reply(req.user.id, req.params.id, req.body.reply) }); } catch (error) { next(error); } };
const moderate = async (req, res, next) => { try { res.json({ success: true, data: await service.moderate(req.user.id, req.params.id, req.body.is_visible) }); } catch (error) { next(error); } };
module.exports = { create, list, reply, moderate };
