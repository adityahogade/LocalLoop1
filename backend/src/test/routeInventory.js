/* Canonical static route inventory. Run: node src/test/routeInventory.js */
const fs = require("fs");
const path = require("path");

const mounts = {
  "health.routes.js": "/api/v1/health", "auth.routes.js": "/api/auth", "user.routes.js": "/api/users",
  "expense.routes.js": "/api/providers/expenses", "bankAccount.routes.js": "/api/providers/bank-account",
  "accounting.routes.js": "/api/providers/accounting", "providerSettlement.routes.js": "/api/providers/settlements",
  "kyc.routes.js": "/api/providers/kyc", "availability.routes.js": "/api/providers", "order.routes.js": "/api/orders",
  "review.routes.js": "/api/reviews", "payment.routes.js": "/api/payments", "delivery.routes.js": "/api/providers/deliveries",
  "notification.routes.js": "/api/notifications", "address.routes.js": "/api/addresses", "customer.routes.js": "/api/customers",
  "wallet.routes.js": "/api/customers/wallet", "invoice.routes.js": "/api/invoices", "coupon.routes.js": "/api/coupons",
  "subscription.routes.js": "/api/subscriptions", "scheduler.routes.js": "/api/v1/subscriptions", "support.routes.js": "/api/support",
  "catalog.routes.js": "/api/catalog", "adminPlatform.routes.js": "/api/admin", "provider.routes.js": "/api/providers",
  "adminKyc.routes.js": "/api/admin/kyc", "service.routes.js": "/api/v1/provider/services",
  "servicePlan.routes.js": "/api/v1/provider/services", "serviceArea.routes.js": "/api/v1/provider/service-areas",
};

const routeDirectory = path.join(__dirname, "../routes");
const routeStart = /router\.(get|post|put|patch|delete)\s*\(/g;
const matchingClose = (source, openingIndex) => {
  let depth = 0; let quote = null;
  for (let index = openingIndex; index < source.length; index += 1) {
    const character = source[index];
    if (quote) { if (character === "\\") index += 1; else if (character === quote) quote = null; continue; }
    if (["'", '"', "`"].includes(character)) { quote = character; continue; }
    if (character === "(") depth += 1;
    if (character === ")" && --depth === 0) return source.slice(openingIndex, index + 1);
  }
  throw new Error("Unbalanced route declaration");
};
const routeDetails = (declaration, routerAuth, routerRole) => {
  const pathMatch = declaration.match(/\(\s*["']([^"']*)["']/);
  const roles = declaration.match(/authorize\(([^)]+)\)/)?.[1]
    ?.split(",").map((value) => ({ 1: "admin", 2: "customer", 3: "provider" }[Number(value.trim())] || value.trim()))
    || routerRole;
  const authRequired = /(?:\(|,)\s*authenticate\s*(?:,|\))/.test(declaration) || routerAuth;
  return { routePath: pathMatch?.[1] || "/", authRequired, role: authRequired ? (roles?.join("|") || "authenticated") : "public" };
};

const routes = Object.entries(mounts).flatMap(([file, mount]) => {
  const source = fs.readFileSync(path.join(routeDirectory, file), "utf8");
  const routerAuth = /router\.use\(\s*authenticate/.test(source);
  const routerRole = source.match(/router\.use\([\s\S]*?authorize\(([^)]+)\)/)?.[1]
    ?.split(",").map((value) => ({ 1: "admin", 2: "customer", 3: "provider" }[Number(value.trim())] || value.trim()));
  const rows = []; let match;
  while ((match = routeStart.exec(source))) {
    const declaration = matchingClose(source, source.indexOf("(", match.index));
    const details = routeDetails(declaration, routerAuth, routerRole);
    const fullPath = `${mount}${details.routePath === "/" ? "" : details.routePath}`;
    rows.push({ method: match[1].toUpperCase(), path: fullPath || "/", authRequired: details.authRequired, role: details.role, missingTokenExpectedStatus: details.authRequired ? 401 : "2xx" });
  }
  return rows;
});

if (routes.length !== 143) throw new Error(`Expected 143 registered verb routes, found ${routes.length}`);
console.log(JSON.stringify({ count: routes.length, routes }, null, 2));

module.exports = { routes };
