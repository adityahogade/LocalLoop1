const { Sequelize, DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Role = require("./Role")(sequelize, DataTypes);

module.exports = db;