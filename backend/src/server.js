const app = require('./app');

const env = require('./config/env');

const {
  connectDatabase,
  sequelize,
} = require('./config/database');

const logger = require('./utils/logger');

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

const startServer = async () => {
  try {
    /*
     * Test MySQL connection before starting
     * the HTTP server.
     */
    await connectDatabase();

    /*
     * Start Express server.
     */
    const server = app.listen(env.port, () => {
      logger.info('ServiceHub backend started', {
        environment: env.nodeEnv,
        port: env.port,
        timezone: env.timezone,
      });

      console.log(
        `🚀 ServiceHub API running on http://localhost:${env.port}`
      );

      console.log(
        `❤️ Health API: http://localhost:${env.port}/api/v1/health`
      );
    });

    /*
     |--------------------------------------------------------------------------
     | Graceful Shutdown
     |--------------------------------------------------------------------------
     */

    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);

      server.close(async () => {
        try {
          await sequelize.close();

          logger.info('Server shutdown completed.');

          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', {
            error: error.message,
            stack: error.stack,
          });

          process.exit(1);
        }
      });
    };

    /*
     * Handle Ctrl + C
     */
    process.on('SIGINT', () => {
      gracefulShutdown('SIGINT');
    });

    /*
     * Handle production termination signal
     */
    process.on('SIGTERM', () => {
      gracefulShutdown('SIGTERM');
    });
  } catch (error) {
    logger.error('Failed to start ServiceHub backend', {
      error: error.message,
      stack: error.stack,
    });

    console.error('❌ Failed to start server:', error.message);

    process.exit(1);
  }
};

/*
|--------------------------------------------------------------------------
| Unhandled Errors
|--------------------------------------------------------------------------
*/

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason instanceof Error
      ? reason.message
      : reason,
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });

  process.exit(1);
});

/*
|--------------------------------------------------------------------------
| Start Application
|--------------------------------------------------------------------------
*/

startServer();