const http = require("http");
const { sequelize, User, Customer, Provider, Category, Service, ServicePlan, Address, SupportTicket, SupportMessage, CustomerSubscription, Payment, Refund, WebhookEvent } = require("../models");

const base = "http://localhost:5000";
const results = [];
const request = (method, path, body, token, raw = false) => new Promise((resolve, reject) => {
  const url = new URL(base + path);
  const payload = body === undefined ? undefined : raw ? body : JSON.stringify(body);
  const req = http.request({ hostname: url.hostname, port: url.port, path: url.pathname + url.search, method, headers: { ...(payload ? { "Content-Type": raw ? "application/json" : "application/json", "Content-Length": Buffer.byteLength(payload) } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) } }, (res) => { let data = ""; res.on("data", (chunk) => { data += chunk; }); res.on("end", () => { let parsed; try { parsed = JSON.parse(data); } catch { parsed = data; } resolve({ status: res.statusCode, body: parsed }); }); }); req.on("error", reject); if (payload) req.write(payload); req.end(); });
const record = (name, response, expected) => { const pass = Array.isArray(expected) ? expected.includes(response.status) : response.status === expected; results.push({ name, status: response.status, expected, pass, body: response.body?.error?.code || response.body?.message || undefined }); };
const unique = (prefix) => `${prefix}.${Date.now()}@example.com`;

(async () => {
  const health = await request("GET", "/api/v1/health"); record("GET /api/v1/health", health, 200);
  const protectedProbe = [
    ["GET", "/api/users"], ["GET", "/api/providers"], ["GET", "/api/providers/me"], ["GET", "/api/providers/availability"], ["GET", "/api/orders"], ["GET", "/api/reviews/1"], ["GET", "/api/notifications"], ["GET", "/api/addresses"], ["GET", "/api/subscriptions"], ["GET", "/api/support/tickets"], ["GET", "/api/admin/categories"], ["GET", "/api/admin/stats"], ["POST", "/api/payments/orders"], ["POST", "/api/payments/verify"], ["POST", "/api/payments/1/refund"], ["GET", "/api/providers/expenses"], ["GET", "/api/providers/bank-account"], ["GET", "/api/providers/accounting/summary"], ["GET", "/api/providers/settlements"], ["GET", "/api/v1/provider/services"], ["GET", "/api/v1/provider/service-areas"], ["GET", "/api/v1/provider/services/1/plans"], ["GET", "/api/providers/kyc"], ["GET", "/api/admin/kyc"],
  ];
  for (const [method, path] of protectedProbe) record(`${method} ${path} unauthenticated`, await request(method, path), 401);

  const adminLogin = await request("POST", "/api/auth/login", { email: "servicehub055@gmail.com", password: "ServiceHub@123" }); record("POST /api/auth/login admin", adminLogin, 200);
  const admin = adminLogin.body?.data?.accessToken || adminLogin.body?.data?.token;
  const customerPayload = { full_name: "API Test Customer", email: unique("customer"), phone: `${Date.now()}`.slice(-10), password: "TestCustomer@123" };
  const providerPayload = { full_name: "API Test Provider", email: unique("provider"), phone: `${Date.now() + 1}`.slice(-10), password: "TestProvider@123", business_name: "API Test Services" };
  const customerRegister = await request("POST", "/api/auth/register", customerPayload); record("POST /api/auth/register", customerRegister, 201);
  const providerRegister = await request("POST", "/api/auth/provider-register", providerPayload); record("POST /api/auth/provider-register", providerRegister, 201);
  const customerLogin = await request("POST", "/api/auth/login", { email: customerPayload.email, password: customerPayload.password }); record("POST /api/auth/login customer", customerLogin, 200);
  const providerLogin = await request("POST", "/api/auth/login", { email: providerPayload.email, password: providerPayload.password }); record("POST /api/auth/login provider", providerLogin, 200);
  const customer = customerLogin.body?.data?.accessToken || customerLogin.body?.data?.token;
  const provider = providerLogin.body?.data?.accessToken || providerLogin.body?.data?.token;
  record("GET /api/auth/me customer", await request("GET", "/api/auth/me", undefined, customer), 200);
  record("GET /api/auth/me invalid token", await request("GET", "/api/auth/me", undefined, "invalid.token.value"), 401);
  record("GET /api/admin/stats customer denied", await request("GET", "/api/admin/stats", undefined, customer), 403);
  record("GET /api/admin/stats provider denied", await request("GET", "/api/admin/stats", undefined, provider), 403);
  record("GET /api/admin/stats admin", await request("GET", "/api/admin/stats", undefined, admin), 200);

  const beforeTickets = await SupportTicket.count();
  const ticket = await request("POST", "/api/support/tickets", { subject: "API verification ticket", category: "other", priority: "low", message: "Live API verification" }, customer); record("POST /api/support/tickets customer", ticket, 201);
  const ticketId = ticket.body?.data?.id;
  if (ticketId) {
    const afterTicket = await SupportTicket.count(); record("support ticket persisted", { status: afterTicket > beforeTickets ? 201 : 500 }, 201);
    record("GET /api/support/tickets/:id owner", await request("GET", `/api/support/tickets/${ticketId}`, undefined, customer), 200);
    record("POST /api/support/tickets/:id/messages owner", await request("POST", `/api/support/tickets/${ticketId}/messages`, { message: "Follow-up" }, customer), 201);
    record("PATCH /api/support/tickets/:id provider denied", await request("PATCH", `/api/support/tickets/${ticketId}`, { status: "in_progress" }, provider), 403);
    record("PATCH /api/support/tickets/:id admin", await request("PATCH", `/api/support/tickets/${ticketId}`, { status: "in_progress" }, admin), 200);
    const messageCount = await SupportMessage.count({ where: { ticket_id: ticketId } }); record("support message persisted", { status: messageCount >= 2 ? 201 : 500 }, 201);
  }

  const categoryName = `API Test ${Date.now()}`;
  const category = await request("POST", "/api/admin/categories", { name: categoryName, slug: categoryName.toLowerCase().replace(/ /g, "-") }, admin); record("POST /api/admin/categories admin", category, 201);
  const categoryId = category.body?.data?.id;
  if (categoryId) { record("PATCH /api/admin/categories/:id", await request("PATCH", `/api/admin/categories/${categoryId}`, { is_active: false }, admin), 200); record("DELETE /api/admin/categories/:id", await request("DELETE", `/api/admin/categories/${categoryId}`, undefined, admin), 204); }
  record("POST /api/admin/categories customer denied", await request("POST", "/api/admin/categories", { name: "Denied", slug: `denied-${Date.now()}` }, customer), 403);

  record("GET /api/catalog/services customer", await request("GET", "/api/catalog/services?limit=5", undefined, customer), 200);
  record("GET /api/catalog/categories customer", await request("GET", "/api/catalog/categories", undefined, customer), 200);
  record("GET /api/catalog/providers customer", await request("GET", "/api/catalog/providers", undefined, customer), 200);
  record("GET /api/catalog/services invalid id", await request("GET", "/api/catalog/services/999999999", undefined, customer), 404);
  record("GET /api/catalog/services unauthenticated", await request("GET", "/api/catalog/services"), 200);
  record("GET /api/catalog/categories unauthenticated", await request("GET", "/api/catalog/categories"), 200);
  record("GET /api/catalog/providers unauthenticated", await request("GET", "/api/catalog/providers"), 200);

  record("GET /api/subscriptions customer", await request("GET", "/api/subscriptions", undefined, customer), 200);
  record("POST /api/subscriptions invalid body", await request("POST", "/api/subscriptions", {}, customer), 400);
  record("GET /api/orders customer", await request("GET", "/api/orders", undefined, customer), 200);
  record("GET /api/notifications customer", await request("GET", "/api/notifications", undefined, customer), 200);
  record("GET /api/addresses customer", await request("GET", "/api/addresses", undefined, customer), 200);
  record("GET /api/providers/availability provider", await request("GET", "/api/providers/availability", undefined, provider), [200, 404]);
  record("GET /api/providers/availability customer denied", await request("GET", "/api/providers/availability", undefined, customer), 403);

  const webhookBody = JSON.stringify({ id: `evt-invalid-${Date.now()}`, event: "payment.captured" });
  record("POST /api/payments/webhook invalid signature", await request("POST", "/api/payments/webhook", webhookBody, undefined, true), [401, 503]);
  record("POST /api/payments/orders missing body", await request("POST", "/api/payments/orders", {}, customer), 400);
  record("POST /api/payments/verify invalid body", await request("POST", "/api/payments/verify", {}, customer), 400);

  const failed = results.filter((item) => !item.pass);
  console.log(JSON.stringify({ totalChecks: results.length, passed: results.length - failed.length, failed: failed.length, results }, null, 2));
  await sequelize.close();
  process.exitCode = failed.length ? 1 : 0;
})().catch(async (error) => { console.error(error.stack || error); await sequelize.close(); process.exitCode = 2; });
