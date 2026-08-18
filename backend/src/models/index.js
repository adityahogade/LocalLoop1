const { Sequelize, DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

// Import models here as the project grows
// Example:
// const User = require("./User")(sequelize, DataTypes);
// const Provider = require("./Provider")(sequelize, DataTypes);

// --------------------------------------------------
// Model registry
// --------------------------------------------------

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// --------------------------------------------------
// Models
// --------------------------------------------------

// Phase 1 currently has no business models.
// Add models here when they are created.

// Example:
//
// db.User = require("./User")(sequelize, DataTypes);
// db.Provider = require("./Provider")(sequelize, DataTypes);
// db.ServiceCategory = require("./ServiceCategory")(sequelize, DataTypes);
// db.Service = require("./Service")(sequelize, DataTypes);
// db.ServiceVariant = require("./ServiceVariant")(sequelize, DataTypes);

// --------------------------------------------------
// Associations
// --------------------------------------------------

// Define relationships here after models are registered.
//
// Example:
//
// db.User.hasOne(db.Provider, {
//     foreignKey: "user_id",
//     as: "provider",
// });
//
// db.Provider.belongsTo(db.User, {
//     foreignKey: "user_id",
//     as: "user",
// });

// --------------------------------------------------
// Export
// --------------------------------------------------

module.exports = db;