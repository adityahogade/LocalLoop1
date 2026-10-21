const service = require("../services/catalog.service");
const services = async (req, res, next) => { try { res.json({ success: true, data: await service.services(req.query) }); } catch (error) { next(error); } };
const getService = async (req, res, next) => { try { res.json({ success: true, data: await service.service(req.params.id, req.query) }); } catch (error) { next(error); } };
const categories = async (req, res, next) => { try { res.json({ success: true, data: await service.categories() }); } catch (error) { next(error); } };
const providers = async (req, res, next) => { try { res.json({ success: true, data: await service.providers(req.query) }); } catch (error) { next(error); } };
module.exports = { services, getService, categories, providers };
