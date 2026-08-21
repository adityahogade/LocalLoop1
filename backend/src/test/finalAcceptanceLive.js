/* Explicit, opt-in local acceptance fixture runner.  It never contacts Razorpay. */
const http = require("http");
const { Customer, Provider, Category, Address, Service, ServicePlan, ServiceArea, Order, Review, CustomerSubscription, SubscriptionPayment, Payment, Invoice, AuditLog, sequelize } = require("../models");
const invoiceService = require("../services/invoice.service");

const base = "http://localhost:5000";
const request = (method, path, body, token) => new Promise((resolve, reject) => {
  const payload = body === undefined ? null : JSON.stringify(body);
  const url = new URL(base + path);
  const req = http.request({ hostname: url.hostname, port: url.port, path: url.pathname + url.search, method, headers: { ...(payload ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) } }, (res) => {
    const parts = []; res.on("data", (part) => parts.push(part)); res.on("end", () => {
      const raw = Buffer.concat(parts); let bodyOut; try { bodyOut = JSON.parse(raw.toString("utf8")); } catch { bodyOut = raw; }
      resolve({ status: res.statusCode, headers: res.headers, body: bodyOut, raw });
    });
  });
  req.on("error", reject); if (payload) req.write(payload); req.end();
});
const tokenOf = (response) => response.body?.data?.accessToken || response.body?.data?.token;
const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const email = (role) => `acceptance-${role}-${stamp}@example.com`;
const phone = (offset) => String((Number(stamp.slice(-9)) + offset) % 9000000000 + 1000000000);
const addDays = (date, days) => { const value = new Date(`${date}T00:00:00Z`); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10); };
const checks = [];
const check = (name, response, expected) => checks.push({ name, expected, actual: response.status, pass: response.status === expected });

(async () => {
  const adminLogin = await request("POST", "/api/auth/login", { email: "servicehub055@gmail.com", password: "ServiceHub@123" });
  check("admin login", adminLogin, 200); const admin = tokenOf(adminLogin);
  const customerData = { full_name: "Acceptance Customer", email: email("customer"), phone: phone(1), password: "Acceptance@123" };
  const otherCustomerData = { full_name: "Acceptance Other Customer", email: email("other"), phone: phone(2), password: "Acceptance@123" };
  const providerData = { full_name: "Acceptance Provider", email: email("provider"), phone: phone(3), password: "Acceptance@123", business_name: `Acceptance Provider ${stamp}` };
  const wrongProviderData = { full_name: "Acceptance Wrong Provider", email: email("wrong-provider"), phone: phone(4), password: "Acceptance@123", business_name: `Acceptance Wrong ${stamp}` };
  for (const data of [customerData, otherCustomerData]) { const response = await request("POST", "/api/auth/register", data); check("customer registration", response, 201); if (response.status !== 201) throw new Error(`Customer fixture registration failed: ${JSON.stringify(response.body)}`); }
  for (const data of [providerData, wrongProviderData]) { const response = await request("POST", "/api/auth/provider-register", data); check("provider registration", response, 201); if (response.status !== 201) throw new Error(`Provider fixture registration failed: ${JSON.stringify(response.body)}`); }
  const customer = tokenOf(await request("POST", "/api/auth/login", { email: customerData.email, password: customerData.password }));
  const otherCustomer = tokenOf(await request("POST", "/api/auth/login", { email: otherCustomerData.email, password: otherCustomerData.password }));
  const provider = tokenOf(await request("POST", "/api/auth/login", { email: providerData.email, password: providerData.password }));
  const wrongProvider = tokenOf(await request("POST", "/api/auth/login", { email: wrongProviderData.email, password: wrongProviderData.password }));
  const customerRow = await Customer.findOne({ include: [{ association: "user", where: { email: customerData.email } }] });
  const providerRow = await Provider.findOne({ include: [{ association: "user", where: { email: providerData.email } }] });
  await Provider.update({ is_active: true, kyc_status: "approved" }, { where: { id: providerRow.id } });
  let category = await Category.findOne();
  if (!category) category = await Category.create({ name: `Acceptance ${stamp}`, slug: `acceptance-${stamp}`, is_active: true });
  const address = await Address.create({ customer_id: customerRow.id, label: "home", area: "Acceptance Area", city: "Pune", state: "Maharashtra", pincode: "411001", is_default: true });
  const service = await Service.create({ provider_id: providerRow.id, category_id: category.id, name: `Acceptance Service ${stamp}`, type: "subscription", base_price: 100, unit: "unit", is_active: true });
  const plan = await ServicePlan.create({ service_id: service.id, frequency: "monthly", price: 100, min_quantity: 1, billing_cycle_days: 30, is_active: true });
  await ServiceArea.create({ provider_id: providerRow.id, state: "Maharashtra", city: "Pune", area: "Acceptance Area", pincode: "411001" });
  const order = await Order.create({ customer_id: customerRow.id, provider_id: providerRow.id, address_id: address.id, category_id: category.id, order_number: `ACC-${stamp}`, status: "completed", subtotal: 100, discount_amount: 0, total_amount: 100, scheduled_date: new Date().toISOString().slice(0, 10), scheduled_time_slot: "morning" });
  const review = await Review.create({ customer_id: customerRow.id, provider_id: providerRow.id, order_id: order.id, reference_type: "order", reference_id: order.id, rating: 5, comment: "Acceptance fixture" });
  check("review reply owner", await request("POST", `/api/reviews/${review.id}/reply`, { reply: "Thank you" }, provider), 200);
  check("review reply wrong provider", await request("POST", `/api/reviews/${review.id}/reply`, { reply: "No" }, wrongProvider), 403);
  check("review reply customer denied", await request("POST", `/api/reviews/${review.id}/reply`, { reply: "No" }, customer), 403);
  check("review reply invalid", await request("POST", `/api/reviews/${review.id}/reply`, { reply: "" }, provider), 400);
  check("review reply unknown", await request("POST", "/api/reviews/999999999/reply", { reply: "No" }, provider), 404);
  check("review moderation admin", await request("PATCH", `/api/reviews/${review.id}/moderation`, { is_visible: false }, admin), 200);
  const persistedReview = await Review.findByPk(review.id); checks.push({ name: "review persistence/audit", expected: "reply, timestamp, hidden audit", actual: Boolean(persistedReview.provider_reply && persistedReview.provider_replied_at && persistedReview.moderation_status === "hidden" && await AuditLog.findOne({ where: { entity_type: "review", entity_id: review.id } })), pass: Boolean(persistedReview.provider_reply && persistedReview.provider_replied_at && persistedReview.moderation_status === "hidden" && await AuditLog.findOne({ where: { entity_type: "review", entity_id: review.id } })) });
  check("review moderation customer denied", await request("PATCH", `/api/reviews/${review.id}/moderation`, { is_visible: true }, customer), 403);

  const previousStart = addDays(new Date().toISOString().slice(0, 10), -30);
  const previousEnd = addDays(previousStart, 29);
  const subscription = await CustomerSubscription.create({ customer_id: customerRow.id, provider_id: providerRow.id, service_id: service.id, service_plan_id: plan.id, address_id: address.id, quantity: 1, delivery_time_slot: "morning", start_date: previousStart, status: "active", next_billing_date: previousEnd });
  await SubscriptionPayment.create({ subscription_id: subscription.id, billing_period_start: previousStart, billing_period_end: previousEnd, amount: 100, status: "pending", due_date: previousEnd, retry_count: 0 });
  const renewal = await request("POST", `/api/subscriptions/${subscription.id}/renew`, {}, customer); check("subscription renewal owner", renewal, 201);
  check("subscription renewal duplicate", await request("POST", `/api/subscriptions/${subscription.id}/renew`, {}, customer), 201);
  const renewed = await CustomerSubscription.findByPk(subscription.id); const billingRows = await SubscriptionPayment.count({ where: { subscription_id: subscription.id } }); checks.push({ name: "renewal billing period and next billing", expected: "2 payments and advanced date", actual: { billingRows, next_billing_date: renewed.next_billing_date }, pass: billingRows === 2 && String(renewed.next_billing_date) > previousEnd });
  check("subscription renewal wrong owner", await request("POST", `/api/subscriptions/${subscription.id}/renew`, {}, otherCustomer), 404);

  // This is a database-only invoice fixture, deliberately not a Razorpay success.
  const fixturePayment = await Payment.create({ customer_id: customerRow.id, reference_type: "order", reference_id: order.id, amount: 100, razorpay_order_id: `fixture_${stamp}`, idempotency_key: `fixture_${stamp}`, status: "paid", method: "fixture", paid_at: new Date() });
  const invoice = await invoiceService.createInvoiceForPayment(fixturePayment.id);
  check("invoice list owner", await request("GET", "/api/invoices", undefined, customer), 200);
  const pdf = await request("GET", `/api/invoices/${invoice.id}/pdf`, undefined, customer); check("invoice pdf owner", pdf, 200); checks.push({ name: "invoice valid PDF", expected: "%PDF bytes", actual: pdf.raw.slice(0, 4).toString("utf8"), pass: pdf.headers["content-type"].includes("application/pdf") && pdf.raw.slice(0, 4).toString("utf8") === "%PDF" });
  check("invoice wrong customer", await request("GET", `/api/invoices/${invoice.id}/pdf`, undefined, otherCustomer), 403);
  check("invoice unknown", await request("GET", "/api/invoices/999999999/pdf", undefined, customer), 404);
  const failed = checks.filter((item) => !item.pass);
  console.log(JSON.stringify({ total: checks.length, passed: checks.length - failed.length, failed, checks }, null, 2));
  await sequelize.close(); process.exitCode = failed.length ? 1 : 0;
})().catch(async (error) => { console.error(error.stack || error, error.parent?.sqlMessage || error.original?.sqlMessage || ""); await sequelize.close(); process.exitCode = 2; });
