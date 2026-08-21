const http = require("http");

const base = "http://localhost:5000";
const request = (method, path, body, token) => new Promise((resolve, reject) => {
  const payload = body === undefined ? undefined : JSON.stringify(body);
  const url = new URL(base + path);
  const req = http.request({ hostname: url.hostname, port: url.port, path: url.pathname + url.search, method, headers: { ...(payload ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) } }, (res) => {
    let raw = "";
    res.on("data", (chunk) => { raw += chunk; });
    res.on("end", () => { let parsed; try { parsed = JSON.parse(raw); } catch { parsed = raw; } resolve({ status: res.statusCode, body: parsed }); });
  });
  req.on("error", reject);
  if (payload) req.write(payload);
  req.end();
});

const tokenFrom = (response) => response.body?.data?.accessToken || response.body?.data?.token;
const unique = (prefix) => `${prefix}.${Date.now()}@example.com`;
const checks = [];
const check = (name, response, expected) => checks.push({ name, status: response.status, expected, pass: response.status === expected });

(async () => {
  const adminLogin = await request("POST", "/api/auth/login", { email: "servicehub055@gmail.com", password: "ServiceHub@123" });
  const admin = tokenFrom(adminLogin);
  const customerPayload = { full_name: "Priority One Customer", email: unique("priority-customer"), phone: String(Date.now()).slice(-10), password: "Priority@123" };
  check("admin login", adminLogin, 200);
  check("customer registration", await request("POST", "/api/auth/register", customerPayload), 201);
  const customerLogin = await request("POST", "/api/auth/login", { email: customerPayload.email, password: customerPayload.password });
  const customer = tokenFrom(customerLogin);
  check("customer login", customerLogin, 200);

  check("wallet read", await request("GET", "/api/customers/wallet", undefined, customer), 200);
  check("wallet transactions", await request("GET", "/api/customers/wallet/transactions", undefined, customer), 200);
  check("invoice list", await request("GET", "/api/invoices", undefined, customer), 200);
  check("coupon invalid code", await request("POST", "/api/coupons/validate", { code: "DOES-NOT-EXIST", amount: 100 }, customer), 404);
  check("admin settings", await request("GET", "/api/admin/settings", undefined, admin), 200);
  check("admin reports", await request("GET", "/api/admin/reports", undefined, admin), 200);
  check("admin services", await request("GET", "/api/admin/services", undefined, admin), 200);
  check("admin service areas", await request("GET", "/api/admin/service-areas", undefined, admin), 200);
  check("admin audit logs", await request("GET", "/api/admin/audit-logs", undefined, admin), 200);
  check("admin commission rules", await request("GET", "/api/admin/commission-rules", undefined, admin), 200);
  check("admin settlements", await request("GET", "/api/admin/settlements", undefined, admin), 200);
  check("scheduler customer denied", await request("POST", "/api/v1/subscriptions/run-scheduler", {}, customer), 403);

  const failed = checks.filter((item) => !item.pass);
  console.log(JSON.stringify({ totalChecks: checks.length, passed: checks.length - failed.length, failed: failed.length, failures: failed }, null, 2));
  process.exitCode = failed.length ? 1 : 0;
})().catch((error) => { console.error(error.stack || error); process.exitCode = 2; });
