const { ValidationError } = require("sequelize");

/**
 * Global error handling middleware
 *
 * Express error middleware must have 4 parameters:
 * (err, req, res, next)
 */
const errorHandler = (err, req, res, next) => {
  void next;

  /*
  |--------------------------------------------------------------------------
  | Default values
  |--------------------------------------------------------------------------
  */

  let statusCode = 500;
  let errorCode = "INTERNAL_SERVER_ERROR";
  let message = "Something went wrong";

  /*
  |--------------------------------------------------------------------------
  | HTTP Status Code
  |--------------------------------------------------------------------------
  |
  | Only accept valid integer HTTP status codes.
  |
  */

  if (Number.isInteger(err.statusCode) && err.statusCode >= 100 && err.statusCode <= 599) {
    statusCode = err.statusCode;
  } else if (
    Number.isInteger(err.status) &&
    err.status >= 100 &&
    err.status <= 599
  ) {
    statusCode = err.status;
  }

  /*
  |--------------------------------------------------------------------------
  | Error Code
  |--------------------------------------------------------------------------
  */

  if (typeof err.errorCode === "string") {
    errorCode = err.errorCode;
  } else if (
    typeof err.code === "string" &&
    !err.code.startsWith("Sequelize")
  ) {
    errorCode = err.code;
  }

  /*
  |--------------------------------------------------------------------------
  | Error Message
  |--------------------------------------------------------------------------
  */

  if (typeof err.message === "string" && err.message.trim()) {
    message = err.message;
  }

  /*
  |--------------------------------------------------------------------------
  | Joi Validation Error
  |--------------------------------------------------------------------------
  */

  if (err.isJoi) {
    statusCode = 422;
    errorCode = "VALIDATION_ERROR";
    message = "Request validation failed";

    return res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message,
        details:
          err.details?.map((detail) => ({
            field: detail.path.join("."),
            message: detail.message,
          })) || [],
      },
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Sequelize Validation Error
  |--------------------------------------------------------------------------
  */

  if (err instanceof ValidationError) {
    statusCode = 422;
    errorCode = "DATABASE_VALIDATION_ERROR";
    message = "Database validation failed";

    return res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message,
        details:
          err.errors?.map((item) => ({
            field: item.path,
            message: item.message,
          })) || [],
      },
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Sequelize Unique Constraint
  |--------------------------------------------------------------------------
  */

  if (err.name === "SequelizeUniqueConstraintError") {
    statusCode = 409;
    errorCode = "DUPLICATE_RESOURCE";
    message = "A resource with the same value already exists.";

    return res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message,
        details:
          err.errors?.map((item) => ({
            field: item.path,
            message: item.message,
          })) || [],
      },
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Sequelize Foreign Key Constraint
  |--------------------------------------------------------------------------
  */

  if (err.name === "SequelizeForeignKeyConstraintError") {
    statusCode = 409;
    errorCode = "FOREIGN_KEY_CONSTRAINT_ERROR";
    message = "The requested resource has an invalid relationship.";
  }

  /*
  |--------------------------------------------------------------------------
  | Not Found Errors
  |--------------------------------------------------------------------------
  */

  if (
    message.toLowerCase().includes("not found") &&
    statusCode === 500
  ) {
    statusCode = 404;
    errorCode = "NOT_FOUND";
  }

  /*
  |--------------------------------------------------------------------------
  | Development Logging
  |--------------------------------------------------------------------------
  */

  if (process.env.NODE_ENV !== "production") {
    console.error("ERROR:", {
      method: req.method,
      url: req.originalUrl,
      statusCode,
      errorCode,
      message,
      stack: err.stack,
    });
  } else {
    console.error("Internal server error:", {
      method: req.method,
      url: req.originalUrl,
      statusCode,
      errorCode,
      message,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Standard ServiceHub Response
  |--------------------------------------------------------------------------
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