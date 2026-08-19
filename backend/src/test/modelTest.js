const db = require("../models");

async function testModels() {
  try {
    console.log("\n=================================");
    console.log("     SERVICEHUB MODEL TEST");
    console.log("=================================\n");

    // Test database connection
    await db.sequelize.authenticate();

    console.log("✅ Database connection successful\n");

    const expectedModels = [
      "Role",
      "User",
      "Customer",
      "Address",
      "Wallet",
      "WalletTransaction",
      "Provider",
      "KycDocument",
      "ProviderBankAccount",
      "ProviderAvailability",
      "ProviderExpense",
      "ProviderEarning",
      "ProviderSettlement",
      "Category",
      "Service",
      "ServicePlan",
      "ServiceArea",
      "CustomerSubscription",
      "SubscriptionDelivery",
      "SkippedDelivery",
      "SubscriptionPayment",
      "Order",
      "OrderItem",
      "Payment",
      "Refund",
      "Invoice",
      "Coupon",
      "CouponUsage",
      "Review",
      "Notification",
      "SupportTicket",
      "SupportMessage",
      "AuditLog",
      "CommissionRule",
      "PlatformSetting",
    ];

    console.log("📦 Checking models...\n");

    let errors = 0;

    for (const modelName of expectedModels) {
      if (db[modelName]) {
        console.log(`✅ ${modelName}`);
      } else {
        console.log(`❌ ${modelName}`);
        errors++;
      }
    }

    console.log("\n=================================");
    console.log("           RESULT");
    console.log("=================================\n");

    console.log(`Models checked : ${expectedModels.length}`);
    console.log(`Errors         : ${errors}`);

    if (errors === 0) {
      console.log("\n🎉 ALL MODELS LOADED SUCCESSFULLY");
    } else {
      console.log("\n❌ MODEL TEST FAILED");
    }
  } catch (error) {
    console.error("\n❌ MODEL TEST CRASHED");
    console.error(error);
  } finally {
    await db.sequelize.close();
    console.log("\n🔌 Database connection closed");
  }
}

testModels();