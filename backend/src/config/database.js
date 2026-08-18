const { Sequelize } = require('sequelize');
const env = require('./env');

const sequelizeOptions = {
  dialect: env.database.dialect,

  host: env.database.host,

  port: env.database.port,

  logging:
    env.nodeEnv === 'development'
      ? console.log
      : false,

  timezone: '+05:30',

  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },

  pool: {
    max: env.database.pool.max,
    min: env.database.pool.min,
    acquire: env.database.pool.acquire,
    idle: env.database.pool.idle,
  },

  dialectOptions: {
    connectTimeout: 10000,
  },
};

/*
 * Enable SSL for cloud MySQL.
 *
 * For local development:
 * DB_SSL=false
 *
 * For cloud/staging/production:
 * DB_SSL=true
 */
if (env.database.ssl) {
  sequelizeOptions.dialectOptions.ssl = {
    require: true,
    rejectUnauthorized: true,
  };
}

const sequelize = new Sequelize(
  env.database.name,
  env.database.user,
  env.database.password,
  sequelizeOptions
);

/**
 * Test database connection.
 */
const testDatabaseConnection = async () => {
  try {
    await sequelize.authenticate();

    console.log(
      '✅ MySQL database connection established successfully.'
    );

    return true;
  } catch (error) {
    console.error(
      '❌ Unable to connect to MySQL database:',
      error.message
    );

    throw error;
  }
};

/**
 * Close database connection.
 */
const closeDatabaseConnection = async () => {
  try {
    await sequelize.close();

    console.log(
      '✅ MySQL database connection closed.'
    );
  } catch (error) {
    console.error(
      '❌ Error while closing MySQL connection:',
      error.message
    );

    throw error;
  }
};

module.exports = {
  sequelize,
  testDatabaseConnection,
  closeDatabaseConnection,
};