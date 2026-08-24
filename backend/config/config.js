const dotenv = require("dotenv");
const path = require("path");

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

// --------------------------------------------------
// CA Certificate from Environment Variable
// --------------------------------------------------

const caCertificate = process.env.DB_CA_CERT
  ? process.env.DB_CA_CERT.replace(/\\n/g, "\n")
  : null;

// --------------------------------------------------
// SSL Configuration
// --------------------------------------------------

const sslConfig = caCertificate
  ? {
      require: true,
      rejectUnauthorized: true,
      ca: caCertificate,
    }
  : false;

// --------------------------------------------------
// Common Database Configuration
// --------------------------------------------------

const databaseConfig = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  dialect: "mysql",

  dialectOptions: {
    ssl: sslConfig,
  },

  timezone: "+05:30",
};

// --------------------------------------------------
// Sequelize Environments
// --------------------------------------------------

module.exports = {
  development: {
    ...databaseConfig,
    logging: console.log,
  },

  test: {
    ...databaseConfig,
    logging: false,
  },

  production: {
    ...databaseConfig,
    logging: false,
  },
};
