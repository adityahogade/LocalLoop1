const winston = require('winston');

const env = require('../config/env');

const {
  combine,
  timestamp,
  printf,
  colorize,
  errors,
  json,
} = winston.format;

/**
 * Development log format
 */
const developmentFormat = combine(
  colorize(),

  timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),

  errors({
    stack: true,
  }),

  printf(({ timestamp, level, message, stack }) => {
    if (stack) {
      return `${timestamp} ${level}: ${stack}`;
    }

    return `${timestamp} ${level}: ${message}`;
  })
);

/**
 * Production log format
 *
 * JSON format is easier for log aggregation,
 * monitoring and cloud deployment.
 */
const productionFormat = combine(
  timestamp(),

  errors({
    stack: true,
  }),

  json()
);

/**
 * Winston logger
 */
const logger = winston.createLogger({
  level: env.logging.level,

  format:
    env.nodeEnv === 'production'
      ? productionFormat
      : developmentFormat,

  transports: [
    new winston.transports.Console(),
  ],

  exitOnError: false,
});

/**
 * Log an informational message.
 */
const info = (message, meta = {}) => {
  logger.info(message, meta);
};

/**
 * Log a warning.
 */
const warn = (message, meta = {}) => {
  logger.warn(message, meta);
};

/**
 * Log an error.
 */
const error = (message, meta = {}) => {
  logger.error(message, meta);
};

/**
 * Log debug information.
 */
const debug = (message, meta = {}) => {
  logger.debug(message, meta);
};

module.exports = {
  logger,
  info,
  warn,
  error,
  debug,
};