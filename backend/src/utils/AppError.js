/**
 * Custom application error.
 *
 * Used for expected application-level errors such as:
 *
 * 400 Bad Request
 * 401 Unauthorized
 * 403 Forbidden
 * 404 Not Found
 * 409 Conflict
 * 422 Validation Error
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details = null) {
    super(message);

    this.name = 'AppError';

    this.statusCode = statusCode;

    this.code = code;

    this.details = details;

    // Maintains proper stack trace in Node.js
    Error.captureStackTrace(this, this.constructor);

    // Used by error-handling middleware
    this.isOperational = true;
  }
}

module.exports = AppError;