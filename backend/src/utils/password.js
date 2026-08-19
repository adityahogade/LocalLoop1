const bcrypt = require("bcrypt");

const SALT_ROUNDS = 12;

const hashPassword = async (password) => {
  if (!password || typeof password !== "string") {
    throw new Error("Password must be a non-empty string");
  }

  return bcrypt.hash(password, SALT_ROUNDS);
};

const comparePassword = async (password, passwordHash) => {
  if (!password || !passwordHash) {
    return false;
  }

  return bcrypt.compare(password, passwordHash);
};

module.exports = {
  hashPassword,
  comparePassword,
};