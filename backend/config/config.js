const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

// Production secret-file location
const productionCaPath = "/etc/secrets/ca.pem";

// Local CA certificate location
const localCaPath = path.resolve(__dirname, "../../ca.pem");

// Use hosted CA if available, otherwise local CA
const caPath = fs.existsSync(productionCaPath)
  ? productionCaPath
  : localCaPath;

// Read CA certificate
let caCertificate = null;

if (fs.existsSync(caPath)) {
  caCertificate = fs.readFileSync(caPath, "utf8");
}

// SSL configuration
const sslConfig = caCertificate
  ? {
      require: true,
      rejectUnauthorized: true,
      ca: caCertificate,
    }
  : false;

// Common configuration
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
