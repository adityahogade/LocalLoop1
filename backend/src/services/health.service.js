const { sequelize } = require("../models");

/**
 * Health Service
 *
 * Contains business logic for checking
 * the health/status of the application and database.
 */
const getHealthStatus = async () => {
    const startTime = Date.now();

    let database = {
        status: "disconnected",
    };

    try {
        // Check MySQL/Sequelize connection
        await sequelize.authenticate();

        database = {
            status: "connected",
        };
    } catch (error) {
        database = {
            status: "disconnected",
            error: error.message,
        };
    }

    const uptime = process.uptime();
    const responseTime = Date.now() - startTime;

    return {
        status: database.status === "connected" ? "healthy" : "unhealthy",

        service: "ServiceHub API",

        environment: process.env.NODE_ENV || "development",

        timestamp: new Date().toISOString(),

        uptime: Math.floor(uptime),

        responseTime: `${responseTime}ms`,

        database,
    };
};

module.exports = {
    getHealthStatus,
};