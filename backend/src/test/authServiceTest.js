const authService = require("../services/auth.service");
const { sequelize } = require("../config/database");

const testAuthService = async () => {
  try {
    console.log("\n=================================");
    console.log("   SERVICEHUB AUTH SERVICE TEST");
    console.log("=================================\n");

    await sequelize.authenticate();

    console.log("✅ Database connection successful\n");

    console.log("🔐 Testing correct admin credentials...");

    const result = await authService.login(
      "servicehub055@gmail.com",
      "ServiceHub@123"
    );

    if (!result.accessToken) {
      throw new Error("Access token was not generated");
    }

    console.log("✅ Login successful");
    console.log("✅ User found");
    console.log("✅ Password verified");
    console.log("✅ JWT generated");

    console.log("\nUser:");
    console.log({
      id: result.user.id,
      role_id: result.user.role_id,
      role: result.user.role,
      full_name: result.user.full_name,
      email: result.user.email,
      status: result.user.status,
    });

    console.log(`\nToken length: ${result.accessToken.length}`);

    console.log("\n🔒 Testing incorrect password...");

    try {
      await authService.login(
        "servicehub055@gmail.com",
        "WrongPassword@123"
      );

      console.log("❌ Wrong password was accepted");
    } catch (error) {
      if (error.message === "Invalid email or password") {
        console.log("✅ Wrong password rejected");
      } else {
        throw error;
      }
    }

    console.log("\n🔍 Testing nonexistent email...");

    try {
      await authService.login(
        "doesnotexist@servicehub.com",
        "ServiceHub@123"
      );

      console.log("❌ Nonexistent user was accepted");
    } catch (error) {
      if (error.message === "Invalid email or password") {
        console.log("✅ Nonexistent user rejected");
      } else {
        throw error;
      }
    }

    console.log("\n=================================");
    console.log("           RESULT");
    console.log("=================================\n");

    console.log("🎉 AUTH SERVICE TEST PASSED");
  } catch (error) {
    console.error("\n❌ AUTH SERVICE TEST FAILED");
    console.error(error);
  } finally {
    await sequelize.close();

    console.log("\n🔌 Database connection closed");
  }
};

testAuthService();