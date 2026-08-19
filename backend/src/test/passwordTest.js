const {
  hashPassword,
  comparePassword,
} = require("../utils/password");

const testPassword = async () => {
  try {
    console.log("\n=================================");
    console.log("     SERVICEHUB PASSWORD TEST");
    console.log("=================================\n");

    const password = "ServiceHub@123";

    console.log("🔐 Creating password hash...");

    const passwordHash = await hashPassword(password);

    console.log("✅ Password hash created");
    console.log(`Hash length: ${passwordHash.length}`);

    console.log("\n🔎 Testing correct password...");

    const correctPassword = await comparePassword(
      password,
      passwordHash
    );

    console.log(
      correctPassword
        ? "✅ Correct password accepted"
        : "❌ Correct password rejected"
    );

    console.log("\n🔎 Testing incorrect password...");

    const wrongPassword = await comparePassword(
      "WrongPassword@123",
      passwordHash
    );

    console.log(
      !wrongPassword
        ? "✅ Incorrect password rejected"
        : "❌ Incorrect password accepted"
    );

    console.log("\n=================================");
    console.log("           RESULT");
    console.log("=================================\n");

    if (correctPassword && !wrongPassword) {
      console.log("🎉 PASSWORD HASHING TEST PASSED");
    } else {
      console.log("❌ PASSWORD HASHING TEST FAILED");
    }
  } catch (error) {
    console.error("\n❌ PASSWORD TEST FAILED");
    console.error(error);
  }
};

testPassword();