const service = require("../services/payment.service");
const create = async (req, res, next) => { try { res.status(201).json({ success: true, data: await service.create(req.user.id, req.body) }); } catch (error) { next(error); } };
const verify = async (req, res, next) => { try { res.json({ success: true, data: await service.verify(req.user.id, req.body) }); } catch (error) { next(error); } };
const refund = async (req, res, next) => { try { res.status(201).json({ success: true, data: await service.refund(req.user.id, req.params.paymentId, req.body) }); } catch (error) { next(error); } };
const webhook = async (req, res, next) => { try { const result = await service.webhook(req.body, req.headers["x-razorpay-signature"], req.headers["x-razorpay-event-id"]); res.json({ success: true, data: result }); } catch (error) { next(error); } };
module.exports = { create, verify, refund, webhook };
