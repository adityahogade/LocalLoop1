const { Sequelize } = require('sequelize');
const env = require('./env');

// --------------------------------------------------
// SSL / CA Certificate
// --------------------------------------------------

const caCertificate = env.database.ca;

let dialectOptions = {};

if (env.database.ssl) {
  if (!caCertificate) {
    throw new Error(
      'DB_SSL=true but DB_CA_CERT is missing'
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
  env.database.name,
  env.database.user,
  env.database.password,
  {
    host: env.database.host,

    port: env.database.port,

    dialect: env.database.dialect,

    dialectOptions,

    pool: env.database.pool,

    retry: {
      max: 3,
    },

    logging:
      env.nodeEnv === 'development'
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

module.exports = {
  sequelize,
  connectDatabase,
};
