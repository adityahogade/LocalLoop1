const { comparePassword } = require("../utils/password");
const { sequelize } = require("../config/database");

const testAdminPassword = async () => {
  try {
    console.log("\n=================================");
    console.log("     SERVICEHUB ADMIN TEST");
    console.log("=================================\n");

    await sequelize.authenticate();

    console.log("✅ Database connection successful");

    const [users] = await sequelize.query(`
      SELECT password_hash
      FROM users
      WHERE email = 'servicehub055@gmail.com'
      LIMIT 1
    `);

    if (!users.length) {
      throw new Error("Admin user not found");
    }

    const passwordHash = users[0].password_hash;

    const correctPassword = await comparePassword(
      "ServiceHub@123",
      passwordHash
    );

    const wrongPassword = await comparePassword(
      "WrongPassword@123",
      passwordHash
    );

    console.log(
      correctPassword
        ? "✅ Correct admin password accepted"
        : "❌ Correct admin password rejected"
    );

    console.log(
      !wrongPassword
        ? "✅ Wrong admin password rejected"
        : "❌ Wrong admin password accepted"
    );

    console.log("\n=================================");
    console.log("           RESULT");
    console.log("=================================\n");

    if (correctPassword && !wrongPassword) {
      console.log("🎉 ADMIN PASSWORD TEST PASSED");
    } else {
      console.log("❌ ADMIN PASSWORD TEST FAILED");
    }
  } catch (error) {
    console.error("❌ ADMIN PASSWORD TEST FAILED");
    console.error(error.message);
  } finally {
    await sequelize.close();
  }
};

testAdminPassword();
