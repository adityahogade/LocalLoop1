const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const env = require("./config/env");
const logger = require("./utils/logger");

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");

const providerRoutes = require("./routes/provider.routes");

const kycRoutes = require("./routes/kyc.routes");
const adminKycRoutes = require("./routes/adminKyc.routes");

const servicePlanRoutes = require("./routes/servicePlan.routes");
const serviceAreaRoutes = require("./routes/serviceArea.routes");

const bankAccountRoutes = require("./routes/bankAccount.routes");
const expenseRoutes = require("./routes/expense.routes");

const accountingRoutes = require("./routes/accounting.routes");

const providerSettlementRoutes = require(
  "./routes/providerSettlement.routes"
);

const serviceRoutes = require(
  "./routes/service.routes"
);

const availabilityRoutes = require("./routes/availability.routes");
const orderRoutes = require("./routes/order.routes");
const reviewRoutes = require("./routes/review.routes");
const paymentRoutes = require("./routes/payment.routes");
const notificationRoutes = require("./routes/notification.routes");
const addressRoutes = require("./routes/address.routes");
const subscriptionRoutes = require("./routes/subscription.routes");
const supportRoutes = require("./routes/support.routes");
const catalogRoutes = require("./routes/catalog.routes");
const adminPlatformRoutes = require("./routes/adminPlatform.routes");
const customerRoutes = require("./routes/customer.routes");
const walletRoutes = require("./routes/wallet.routes");
const invoiceRoutes = require("./routes/invoice.routes");
const couponRoutes = require("./routes/coupon.routes");
const schedulerRoutes = require("./routes/scheduler.routes");
const deliveryRoutes = require("./routes/delivery.routes");

/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/

const notFound = require("./midleware/notFound");
const errorHandler = require("./midleware/errorHandler");

/*
|--------------------------------------------------------------------------
| Express App
|--------------------------------------------------------------------------
*/

const app = express();

/*
|--------------------------------------------------------------------------
| Security Middleware
|--------------------------------------------------------------------------
*/

/*
 * Helmet
 *
 * Adds security-related HTTP headers.
 */

app.use(helmet());

/*
 * CORS
 *
 * Allows the React frontend to communicate with the API.
 */

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "X-Requested-With",
    ],
  })
);

/*
|--------------------------------------------------------------------------
| Rate Limiting
|--------------------------------------------------------------------------
*/

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max:
    env.nodeEnv === "production"
      ? 100
      : 1000,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,

    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests. Please try again later.",
    },
  },
});

app.use("/api", apiLimiter);

/*
|--------------------------------------------------------------------------
| Body Parsing
|--------------------------------------------------------------------------
*/

/*
 * JSON
 */

app.use(
  "/api/payments/webhook",
  express.raw({ type: "application/json", limit: "1mb" })
);

app.use(
  express.json({
    limit: "1mb",
  })
);

/*
 * URL Encoded
 */

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);

/*
|--------------------------------------------------------------------------
| Request Logger
|--------------------------------------------------------------------------
*/

app.use((req, res, next) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;

    logger.info("HTTP Request", {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
});

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Health API
|--------------------------------------------------------------------------
|
| GET /api/v1/health
|
|--------------------------------------------------------------------------
*/

app.use(
  "/api/v1/health",
  healthRoutes
);

/*
|--------------------------------------------------------------------------
| Authentication API
|--------------------------------------------------------------------------
|
| POST /api/auth/login
|
|--------------------------------------------------------------------------
*/

app.use(
  "/api/auth",
  authRoutes
);

/*
|--------------------------------------------------------------------------
| User API
|--------------------------------------------------------------------------
*/

app.use(
  "/api/users",
  userRoutes
);

/*
|--------------------------------------------------------------------------
| Provider APIs
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Specific provider routes MUST come before:
|
|     /api/providers
|
| because /api/providers is a generic route.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Provider Expenses
|--------------------------------------------------------------------------
|
| /api/providers/expenses
|
*/

app.use(
  "/api/providers/expenses",
  expenseRoutes
);

/*
|--------------------------------------------------------------------------
| Provider Bank Account
|--------------------------------------------------------------------------
|
| /api/providers/bank-account
|
*/

app.use(
  "/api/providers/bank-account",
  bankAccountRoutes
);

/*
|--------------------------------------------------------------------------
| Provider Accounting
|--------------------------------------------------------------------------
|
| /api/providers/accounting
|
*/

app.use(
  "/api/providers/accounting",
  accountingRoutes
);

/*
|--------------------------------------------------------------------------
| Provider Settlements
|--------------------------------------------------------------------------
|
| /api/providers/settlements
|
| MUST BE BEFORE:
|
| /api/providers
|
|--------------------------------------------------------------------------
*/

app.use(
  "/api/providers/settlements",
  providerSettlementRoutes
);

/*
|--------------------------------------------------------------------------
| Provider KYC
|--------------------------------------------------------------------------
|
| /api/providers/kyc
|
*/

app.use(
  "/api/providers/kyc",
  kycRoutes
);

app.use(
  "/api/providers",
  availabilityRoutes
);

app.use(
  "/api/orders",
  orderRoutes
);

app.use(
  "/api/reviews",
  reviewRoutes
);

app.use(
  "/api/payments",
  paymentRoutes
);

app.use("/api/providers/deliveries", deliveryRoutes);

app.use(
  "/api/notifications",
  notificationRoutes
);

app.use(
  "/api/addresses",
  addressRoutes
);

app.use(
  "/api/customers",
  customerRoutes
);

app.use(
  "/api/customers/wallet",
  walletRoutes
);

app.use(
  "/api/invoices",
  invoiceRoutes
);

app.use(
  "/api/coupons",
  couponRoutes
);

app.use(
  "/api/subscriptions",
  subscriptionRoutes
);

app.use(
  "/api/v1/subscriptions",
  schedulerRoutes
);

app.use(
  "/api/support",
  supportRoutes
);

app.use(
  "/api/catalog",
  catalogRoutes
);

app.use(
  "/api/admin",
  adminPlatformRoutes
);

/*
|--------------------------------------------------------------------------
| Generic Provider Routes
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| This MUST come AFTER all specific /api/providers/*
| routes.
|
|--------------------------------------------------------------------------
*/

app.use(
  "/api/providers",
  providerRoutes
);

/*
|--------------------------------------------------------------------------
| Admin KYC
|--------------------------------------------------------------------------
*/

app.use(
  "/api/admin/kyc",
  adminKycRoutes
);

/*
|--------------------------------------------------------------------------
| Provider Service Plans
|--------------------------------------------------------------------------
|
| /api/v1/provider/services
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Provider Services
|--------------------------------------------------------------------------
*/

app.use(
  "/api/v1/provider/services",
  serviceRoutes
);

/*
|--------------------------------------------------------------------------
| Provider Service Plans
|--------------------------------------------------------------------------
*/

app.use(
  "/api/v1/provider/services",
  servicePlanRoutes
);
/*
|--------------------------------------------------------------------------
| Provider Service Areas
|--------------------------------------------------------------------------
|
| /api/v1/provider/service-areas
|
|--------------------------------------------------------------------------
*/

app.use(
  "/api/v1/provider/service-areas",
  serviceAreaRoutes
);

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/

app.use(notFound);

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

app.use(errorHandler);

/*
|--------------------------------------------------------------------------
| Export App
|--------------------------------------------------------------------------
*/

module.exports = app;