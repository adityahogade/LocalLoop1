const db = require("../models");

const associations = [
  ["Role", "users"],

  ["User", "role"],
  ["User", "customer"],
  ["User", "provider"],
  ["User", "notifications"],
  ["User", "supportTickets"],
  ["User", "supportMessages"],
  ["User", "auditLogs"],
  ["User", "createdCommissionRules"],
  ["User", "updatedPlatformSettings"],

  ["Customer", "user"],
  ["Customer", "addresses"],
  ["Customer", "wallet"],
  ["Customer", "subscriptions"],
  ["Customer", "orders"],
  ["Customer", "payments"],
  ["Customer", "invoices"],
  ["Customer", "couponUsages"],
  ["Customer", "reviews"],

  ["Address", "customer"],

  ["Wallet", "customer"],
  ["Wallet", "transactions"],

  ["WalletTransaction", "wallet"],

  ["Provider", "user"],
  ["Provider", "kycDocuments"],
  ["Provider", "bankAccount"],
  ["Provider", "availability"],
  ["Provider", "expenses"],
  ["Provider", "earnings"],
  ["Provider", "settlements"],
  ["Provider", "services"],
  ["Provider", "serviceAreas"],
  ["Provider", "subscriptions"],
  ["Provider", "orders"],
  ["Provider", "invoices"],
  ["Provider", "reviews"],

  ["KycDocument", "provider"],
  ["ProviderBankAccount", "provider"],
  ["ProviderAvailability", "provider"],
  ["ProviderExpense", "provider"],
  ["ProviderEarning", "provider"],
  ["ProviderSettlement", "provider"],
  
  ["Category", "services"],
  ["Category", "coupons"],
  ["Category", "commissionRules"],

  ["Service", "provider"],
  ["Service", "category"],
  ["Service", "orderItems"],
  ["Service", "subscriptions"],
  ["Service", "commissionRules"],

  ["ServiceArea", "provider"],

  ["CustomerSubscription", "customer"],
  ["CustomerSubscription", "provider"],
  ["CustomerSubscription", "service"],
  ["CustomerSubscription", "address"],
  ["CustomerSubscription", "deliveries"],
  ["CustomerSubscription", "skippedDeliveries"],
  ["CustomerSubscription", "payments"],

  ["SubscriptionDelivery", "subscription"],
  ["SkippedDelivery", "subscription"],
  ["SubscriptionPayment", "subscription"],

  ["Order", "customer"],
  ["Order", "provider"],
  ["Order", "address"],
  ["Order", "items"],
  ["Order", "couponUsages"],
  ["Order", "review"],

  ["OrderItem", "order"],
  ["OrderItem", "service"],

  ["Payment", "customer"],
  ["Payment", "refunds"],

  ["Refund", "payment"],

  ["Invoice", "customer"],
  ["Invoice", "provider"],

  ["Coupon", "category"],
  ["Coupon", "usages"],

  ["CouponUsage", "coupon"],
  ["CouponUsage", "customer"],
  ["CouponUsage", "order"],

  ["Review", "customer"],
  ["Review", "provider"],
  ["Review", "order"],

  ["Notification", "user"],

  ["SupportTicket", "user"],
  ["SupportTicket", "messages"],

  ["SupportMessage", "ticket"],
  ["SupportMessage", "sender"],

  ["AuditLog", "user"],

  ["CommissionRule", "category"],
  ["CommissionRule", "service"],
  ["CommissionRule", "creator"],

  ["PlatformSetting", "updatedByUser"],
];

async function testAssociations() {
  try {
    console.log("\n=================================");
    console.log("   SERVICEHUB ASSOCIATION TEST");
    console.log("=================================\n");

    await db.sequelize.authenticate();

    console.log("✅ Database connection successful\n");

    let errors = 0;

    console.log("🔗 Checking associations...\n");

    for (const [modelName, associationName] of associations) {
      const model = db[modelName];

      if (!model) {
        console.log(`❌ ${modelName} model not found`);
        errors++;
        continue;
      }

      if (!model.associations[associationName]) {
        console.log(
          `❌ ${modelName}.${associationName} NOT FOUND`
        );
        errors++;
      } else {
        console.log(
          `✅ ${modelName}.${associationName}`
        );
      }
    }

    console.log("\n=================================");
    console.log("           RESULT");
    console.log("=================================\n");

    console.log(`Associations checked : ${associations.length}`);
    console.log(`Errors               : ${errors}`);

    if (errors === 0) {
      console.log("\n🎉 ALL ASSOCIATIONS PASSED");
    } else {
      console.log("\n❌ ASSOCIATION TEST FAILED");
    }
  } catch (error) {
    console.error("\n❌ ASSOCIATION TEST CRASHED");
    console.error(error);
  } finally {
    await db.sequelize.close();

    console.log("\n🔌 Database connection closed");
  }
}

testAssociations();