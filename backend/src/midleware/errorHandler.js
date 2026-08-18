const { ValidationError } = require('sequelize');

/**
 * Global error handling middleware.
 *
 * Express error middleware must have 4 parameters:
 * (err, req, res, next)
 */
const errorHandler = (err, req, res, next) => {
  // Prevent unused next warning in some linters.
  void next;

  let statusCode = err.statusCode || 500;
  let errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'Something went wrong';

  /*
   * Joi validation errors
   */
  if (err.isJoi) {
    statusCode = 422;
    errorCode = 'VALIDATION_ERROR';

    message = 'Request validation failed';

    return res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message,
        details: err.details?.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })) || [],
      },
    });
  }

  /*
   * Sequelize validation errors
   */
  if (err instanceof ValidationError) {
    statusCode = 422;
    errorCode = 'DATABASE_VALIDATION_ERROR';

    return res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: 'Database validation failed',
        details: err.errors?.map((item) => ({
          field: item.path,
          message: item.message,
        })) || [],
      },
    });
  }

  /*
   * Sequelize unique constraint error
   */
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    errorCode = 'DUPLICATE_RESOURCE';

    return res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: 'A resource with the same value already exists.',
        details: err.errors?.map((item) => ({
          field: item.path,
          message: item.message,
        })) || [],
      },
    });
  }

  /*
   * Sequelize foreign-key constraint error
   */
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 409;
    errorCode = 'FOREIGN_KEY_CONSTRAINT_ERROR';

    message = 'The requested resource has an invalid relationship.';
  }

  /*
   * Development logging.
   *
   * Detailed stack traces should NOT be returned to clients
   * in production.
   */
  if (process.env.NODE_ENV !== 'production') {
    console.error('ERROR:', {
      method: req.method,
      url: req.originalUrl,
      statusCode,
      errorCode,
      message,
      stack: err.stack,
    });
  } else {
    console.error('Internal server error:', {
      method: req.method,
      url: req.originalUrl,
      statusCode,
      errorCode,
      message,
    });
  }

  /*
   * Standard ServiceHub error envelope.
   */
  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
    },
  });
};

module.exports = errorHandler;