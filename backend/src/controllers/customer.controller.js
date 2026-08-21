const service = require("../services/customer.service");

const get = async (req, res, next) => { try { res.json({ success: true, data: await service.getProfile(req.user.id) }); } catch (error) { next(error); } };
const update = async (req, res, next) => { try { res.json({ success: true, data: await service.updateProfile(req.user.id, req.body) }); } catch (error) { next(error); } };
module.exports = { get, update };
