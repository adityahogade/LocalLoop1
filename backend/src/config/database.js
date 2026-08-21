const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const env = require('./env');

const configuredCaPath = process.env.DB_SSL_CA;
const caPath = configuredCaPath
  ? path.resolve(configuredCaPath)
  : null;

const dialectOptions = env.database.ssl
  ? {
      ssl: {
        require: true,
        rejectUnauthorized: true,
        ...(caPath && fs.existsSync(caPath)
          ? { ca: fs.readFileSync(caPath) }
          : {}),
      },
    }
  : {};

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
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