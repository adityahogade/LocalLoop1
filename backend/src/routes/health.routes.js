const express = require('express');

const {
  sequelize,
} = require('../config/database');

const router = express.Router();

/**
 * GET /api/v1/health
 *
 * Health check endpoint.
 *
 * Checks:
 * 1. API/server is running
 * 2. MySQL database connection is working
 */
router.get('/', async (req, res) => {
  let databaseStatus = 'disconnected';

  try {
    // Check MySQL connection
    await sequelize.authenticate();

    databaseStatus = 'connected';

    return res.status(200).json({
      success: true,
      message: 'ServiceHub API is healthy',

      data: {
        service: 'servicehub-backend',
        environment: process.env.NODE_ENV || 'development',
        server: 'running',
        database: databaseStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    });
  } catch (error) {
    console.error('Health check database error:', error.message);

    return res.status(503).json({
      success: false,
      message: 'ServiceHub API is unhealthy',

      data: {
        service: 'servicehub-backend',
        environment: process.env.NODE_ENV || 'development',
        server: 'running',
        database: databaseStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },

      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database connection is unavailable',
      },
    });
  }
});

module.exports = router;