const cron = require("node-cron");
const deliveryJob = require("./subscriptionDeliveryJob");
const billingRetryService = require("../services/billingRetry.service");
const billingJob = require("./subscriptionBillingJob");

const start = () => cron.schedule("5 0 * * *", async () => {
	await deliveryJob.run();
	await billingJob.run();
	await billingRetryService.processFailedRenewals();
}, { timezone: "Asia/Kolkata" });
module.exports = { start };
