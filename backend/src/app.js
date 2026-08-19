const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const logger = require('./utils/logger');

const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');

const notFound = require('./midleware/notFound');
const errorHandler = require('./midleware/errorHandler');

const userRoutes = require('./routes/user.routes');

const providerRoutes = require("./routes/provider.routes");
const app = express();

/*
|--------------------------------------------------------------------------
| Security Middleware
|--------------------------------------------------------------------------
*/

/**
 * Helmet
 *
 * Adds security-related HTTP headers.
 */
app.use(helmet());

/**
 * CORS
 *
 * Allows the React frontend to communicate with the API.
 */
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
    ],
  })
);

/**
 * Rate Limiting
 *
 * Basic protection against excessive requests.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: env.nodeEnv === 'production' ? 100 : 1000,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
    },
  },
});

app.use('/api', apiLimiter);

/*
|--------------------------------------------------------------------------
| Body Parsing
|--------------------------------------------------------------------------
*/

/**
 * Parse JSON request bodies.
 */
app.use(
  express.json({
    limit: '1mb',
  })
);

/**
 * Parse URL-encoded request bodies.
 */
app.use(
  express.urlencoded({
    extended: true,
    limit: '1mb',
  })
);

/*
|--------------------------------------------------------------------------
| Request Logger
|--------------------------------------------------------------------------
*/

app.use((req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    logger.info('HTTP Request', {
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

/**
 * Health API
 *
 * GET /api/v1/health
 */
app.use('/api/v1/health', healthRoutes);

/**
 * Authentication API
 *
 * POST /api/auth/login
 */
app.use('/api/auth', authRoutes);


app.use('/api/users', userRoutes);

/*
|--------------------------------------------------------------------------
| API 404 Handler
|--------------------------------------------------------------------------
*/


app.use("/api/providers", providerRoutes);


app.use(notFound);

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

app.use(errorHandler);

module.exports = app;