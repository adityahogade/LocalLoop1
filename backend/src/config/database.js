const { Sequelize } = require('sequelize');
const env = require('./env');

// --------------------------------------------------
// MySQL SSL Configuration
// --------------------------------------------------

const caCertificate = process.env.DB_CA_CERT
  ? process.env.DB_CA_CERT.replace(/\\n/g, '\n')
  : null;

const dialectOptions = env.database.ssl
  ? {
      ssl: {
        require: true,
        rejectUnauthorized: true,
        ...(caCertificate
          ? {
              ca: caCertificate,
            }
          : {}),
      },
    }
  : {};

// --------------------------------------------------
// Sequelize Instance
// --------------------------------------------------

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),

    dialect: 'mysql',

    dialectOptions,

    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },

    retry: {
      max: 3,
    },

    logging:
      process.env.NODE_ENV === 'development'
        ? console.log
        : false,

    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },

    timezone: '+05:30',
  }
);

// --------------------------------------------------
// Database Connection
// --------------------------------------------------

const connectDatabase = async () => {
  try {
    await sequelize.authenticate();

    console.log('✅ MySQL database connected successfully');
  } catch (error) {
    console.error('❌ MySQL database connection failed');
    console.error(error.message);

    throw error;
  }
};

module.exports = {
  sequelize,
  connectDatabase,
};
