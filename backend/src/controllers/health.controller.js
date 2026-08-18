const { getDatabaseHealth } = require("../config/database");

/**
 * Health check controller
 *
 * GET /api/v1/health
 */
const getHealth = async (req, res, next) => {
  try {
    const database = await getDatabaseHealth();

    const isHealthy = database.status === "UP";

    return res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      message: isHealthy
        ? "ServiceHub API is healthy"
        : "ServiceHub API is unhealthy",
      data: {
        service: "ServiceHub API",
        status: isHealthy ? "UP" : "DOWN",
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString(),
        database
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealth
};