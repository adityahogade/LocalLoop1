require("dotenv").config();

const {
  generateAccessToken,
  verifyAccessToken,
} = require("../utils/jwt");

const testJwt = () => {
  try {
    console.log("\n=================================");
    console.log("       SERVICEHUB JWT TEST");
    console.log("=================================\n");

    const payload = {
      userId: 1,
      roleId: 1,
    };

    console.log("🔐 Generating access token...");

    const token = generateAccessToken(payload);

    console.log("✅ Access token generated");
    console.log(`Token length: ${token.length}`);

    console.log("\n🔎 Verifying access token...");

    const decoded = verifyAccessToken(token);

    console.log("✅ Access token verified");

    console.log("\nDecoded payload:");
    console.log(decoded);

    if (
      decoded.userId === 1 &&
      decoded.roleId === 1
    ) {
      console.log("\n🎉 JWT TEST PASSED");
    } else {
      console.log("\n❌ JWT TEST FAILED");
    }
  } catch (error) {
    console.error("\n❌ JWT TEST FAILED");
    console.error(error.message);
  }
};

testJwt();