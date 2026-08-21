const job = require("../jobs/subscriptionDeliveryJob");
const billingJob = require("../jobs/subscriptionBillingJob");
const run = async (req, res, next) => { try { const targetDate = req.body?.targetDate || req.query.targetDate; res.json({ success: true, data: { deliveries: await job.run(targetDate), billing: await billingJob.run(targetDate) } }); } catch (error) { next(error); } };
module.exports = { run };
