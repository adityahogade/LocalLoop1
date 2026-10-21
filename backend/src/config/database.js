const { Sequelize } = require('sequelize');
require('dotenv').config();

// --------------------------------------------------
// SSL / CA Certificate
// DB_SSL_CA contains the actual CA certificate,
// NOT a file path.
// --------------------------------------------------

const caCertificate = process.env.DB_SSL_CA
  ? process.env.DB_SSL_CA.replace(/\\n/g, '\n')
  : null;

const sslEnabled = process.env.DB_SSL === 'true';

let dialectOptions = {};

if (sslEnabled) {
  if (!caCertificate) {
    throw new Error(
      'DB_SSL=true but DB_SSL_CA is missing'
    );
  }

  dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: true,
      ca: caCertificate,
    },
  };
}

// --------------------------------------------------
// Sequelize
// --------------------------------------------------

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    dialect: process.env.DB_DIALECT || 'mysql',

    dialectOptions,

    // Connection Pool
    pool: {
      max: Number(process.env.DB_POOL_MAX) || 10,
      min: Number(process.env.DB_POOL_MIN) || 0,
      acquire: Number(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: Number(process.env.DB_POOL_IDLE) || 10000,
    },

    // Retry failed connections
    retry: {
      max: 3,
    },

    // Logging
    logging:
      process.env.NODE_ENV === 'development'
        ? console.log
        : false,

    // Model defaults
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },

    // India Standard Time
    timezone: '+05:30',
  }
);

// --------------------------------------------------
// Database Connection
// --------------------------------------------------

const connectDatabase = async () => {
  try {
    await sequelize.authenticate();

    console.log(
      '✅ MySQL database connected successfully'
    );
  } catch (error) {
    console.error(
      '❌ MySQL database connection failed'
    );

    console.error(error.message);

    throw error;
  }
};

// --------------------------------------------------
// Exports
// --------------------------------------------------

module.exports = {
  sequelize,
  connectDatabase,
};