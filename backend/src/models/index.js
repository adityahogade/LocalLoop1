const { Sequelize, DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Role = require("./Role")(sequelize, DataTypes);
db.User = require("./User")(sequelize, DataTypes);
db.Customer = require("./Customer")(sequelize, DataTypes);
db.Address = require("./Address")(sequelize, DataTypes);
db.Wallet = require("./Wallet")(sequelize, DataTypes);
db.WalletTransaction = require("./WalletTransaction")(sequelize, DataTypes);
db.Provider = require("./Provider")(sequelize, DataTypes);
db.KycDocument = require("./KycDocument")(sequelize, DataTypes);
db.ProviderBankAccount = require("./ProviderBankAccount")(
  sequelize,
  DataTypes
);
db.ProviderAvailability = require("./ProviderAvailability")(
  sequelize,
  DataTypes
);
db.ProviderExpense = require("./ProviderExpense")(sequelize, DataTypes);
db.ProviderEarning = require("./ProviderEarning")(sequelize, DataTypes);
db.ProviderSettlement = require("./ProviderSettlement")(
  sequelize,
  DataTypes
);
db.Category = require("./Category")(sequelize, DataTypes);
db.Service = require("./Service")(sequelize, DataTypes);
db.ServiceArea = require("./ServiceArea")(sequelize, DataTypes);
db.CustomerSubscription = require("./CustomerSubscription")(
  sequelize,
  DataTypes
);
db.SubscriptionDelivery = require("./SubscriptionDelivery")(
  sequelize,
  DataTypes
);
db.SkippedDelivery = require("./SkippedDelivery")(
  sequelize,
  DataTypes
);
db.SubscriptionPayment = require("./SubscriptionPayment")(
  sequelize,
  DataTypes
);
db.Order = require("./Order")(sequelize, DataTypes);
db.OrderItem = require("./OrderItem")(sequelize, DataTypes);
db.Payment = require("./Payment")(sequelize, DataTypes);
db.Refund = require("./Refund")(sequelize, DataTypes);
db.Invoice = require("./Invoice")(sequelize, DataTypes);
db.Coupon = require("./Coupon")(sequelize, DataTypes);
db.CouponUsage = require("./CouponUsage")(sequelize, DataTypes);
db.Review = require("./Review")(sequelize, DataTypes);
db.Notification = require("./Notification")(sequelize, DataTypes);
db.SupportTicket = require("./SupportTicket")(
  sequelize,
  DataTypes
);
db.SupportMessage = require("./SupportMessage")(
  sequelize,
  DataTypes
);
db.AuditLog = require("./AuditLog")(sequelize, DataTypes);
db.CommissionRule = require("./CommissionRule")(
  sequelize,
  DataTypes
);
db.PlatformSetting = require("./PlatformSetting")(
  sequelize,
  DataTypes
);

db.Role.hasMany(db.User, {
  foreignKey: "role_id",
  as: "users",
});

db.User.belongsTo(db.Role, {
  foreignKey: "role_id",
  as: "role",
});

db.User.hasOne(db.Customer, {
  foreignKey: "user_id",
  as: "customer",
});

db.Customer.belongsTo(db.User, {
  foreignKey: "user_id",
  as: "user",
});

db.Customer.hasMany(db.Address, {
  foreignKey: "customer_id",
  as: "addresses",
});

db.Address.belongsTo(db.Customer, {
  foreignKey: "customer_id",
  as: "customer",
});

db.Customer.belongsTo(db.Address, {
  foreignKey: "default_address_id",
  as: "defaultAddress",
});

db.Address.hasMany(db.Customer, {
  foreignKey: "default_address_id",
  as: "defaultForCustomers",
});



db.Customer.hasOne(db.Wallet, {
  foreignKey: "customer_id",
  as: "wallet",
});

db.Wallet.belongsTo(db.Customer, {
  foreignKey: "customer_id",
  as: "customer",
});


db.Wallet.hasMany(db.WalletTransaction, {
  foreignKey: "wallet_id",
  as: "transactions",
});

db.WalletTransaction.belongsTo(db.Wallet, {
  foreignKey: "wallet_id",
  as: "wallet",
});


db.User.hasOne(db.Provider, {
  foreignKey: "user_id",
  as: "provider",
});

db.Provider.belongsTo(db.User, {
  foreignKey: "user_id",
  as: "user",
});


db.Provider.hasMany(db.KycDocument, {
  foreignKey: "provider_id",
  as: "kycDocuments",
});

db.KycDocument.belongsTo(db.Provider, {
  foreignKey: "provider_id",
  as: "provider",
});


db.Provider.hasOne(db.ProviderBankAccount, {
  foreignKey: "provider_id",
  as: "bankAccount",
});

db.ProviderBankAccount.belongsTo(db.Provider, {
  foreignKey: "provider_id",
  as: "provider",
});


db.Provider.hasMany(db.ProviderAvailability, {
  foreignKey: "provider_id",
  as: "availability",
});

db.ProviderAvailability.belongsTo(db.Provider, {
  foreignKey: "provider_id",
  as: "provider",
});


db.Provider.hasMany(db.ProviderExpense, {
  foreignKey: "provider_id",
  as: "expenses",
});

db.ProviderExpense.belongsTo(db.Provider, {
  foreignKey: "provider_id",
  as: "provider",
});


db.Provider.hasMany(db.ProviderEarning, {
  foreignKey: "provider_id",
  as: "earnings",
});

db.ProviderEarning.belongsTo(db.Provider, {
  foreignKey: "provider_id",
  as: "provider",
});


db.Provider.hasMany(db.ProviderSettlement, {
  foreignKey: "provider_id",
  as: "settlements",
});

db.ProviderSettlement.belongsTo(db.Provider, {
  foreignKey: "provider_id",
  as: "provider",
});

db.ProviderEarning.belongsTo(db.ProviderSettlement, {
  foreignKey: "settlement_id",
  as: "settlement",
});

db.ProviderSettlement.hasMany(db.ProviderEarning, {
  foreignKey: "settlement_id",
  as: "earnings",
});


db.Category.hasMany(db.Service, {
  foreignKey: "category_id",
  as: "services",
});


db.Provider.hasMany(db.Service, {
  foreignKey: "provider_id",
  as: "services",
});

db.Service.belongsTo(db.Provider, {
  foreignKey: "provider_id",
  as: "provider",
});

db.Category.hasMany(db.Service, {
  foreignKey: "category_id",
  as: "services",
});

db.Service.belongsTo(db.Category, {
  foreignKey: "category_id",
  as: "category",
});


db.Provider.hasMany(db.ServiceArea, {
  foreignKey: "provider_id",
  as: "serviceAreas",
});

db.ServiceArea.belongsTo(db.Provider, {
  foreignKey: "provider_id",
  as: "provider",
});


db.Customer.hasMany(db.CustomerSubscription, {
  foreignKey: "customer_id",
  as: "subscriptions",
});

db.CustomerSubscription.belongsTo(db.Customer, {
  foreignKey: "customer_id",
  as: "customer",
});

db.Provider.hasMany(db.CustomerSubscription, {
  foreignKey: "provider_id",
  as: "subscriptions",
});

db.CustomerSubscription.belongsTo(db.Provider, {
  foreignKey: "provider_id",
  as: "provider",
});

db.Service.hasMany(db.CustomerSubscription, {
  foreignKey: "service_id",
  as: "subscriptions",
});

db.CustomerSubscription.belongsTo(db.Service, {
  foreignKey: "service_id",
  as: "service",
});

db.ServicePlan.hasMany(db.CustomerSubscription, {
  foreignKey: "service_plan_id",
  as: "subscriptions",
});

db.CustomerSubscription.belongsTo(db.ServicePlan, {
  foreignKey: "service_plan_id",
  as: "servicePlan",
});

db.Address.hasMany(db.CustomerSubscription, {
  foreignKey: "address_id",
  as: "subscriptions",
});

db.CustomerSubscription.belongsTo(db.Address, {
  foreignKey: "address_id",
  as: "address",
});


db.CustomerSubscription.hasMany(db.SubscriptionDelivery, {
  foreignKey: "subscription_id",
  as: "deliveries",
});

db.SubscriptionDelivery.belongsTo(db.CustomerSubscription, {
  foreignKey: "subscription_id",
  as: "subscription",
});


db.CustomerSubscription.hasMany(db.SkippedDelivery, {
  foreignKey: "subscription_id",
  as: "skippedDeliveries",
});

db.SkippedDelivery.belongsTo(db.CustomerSubscription, {
  foreignKey: "subscription_id",
  as: "subscription",
});


db.CustomerSubscription.hasMany(db.SubscriptionPayment, {
  foreignKey: "subscription_id",
  as: "payments",
});

db.SubscriptionPayment.belongsTo(db.CustomerSubscription, {
  foreignKey: "subscription_id",
  as: "subscription",
});


db.Customer.hasMany(db.Order, {
  foreignKey: "customer_id",
  as: "orders",
});

db.Order.belongsTo(db.Customer, {
  foreignKey: "customer_id",
  as: "customer",
});

db.Provider.hasMany(db.Order, {
  foreignKey: "provider_id",
  as: "orders",
});

db.Order.belongsTo(db.Provider, {
  foreignKey: "provider_id",
  as: "provider",
});

db.Address.hasMany(db.Order, {
  foreignKey: "address_id",
  as: "orders",
});

db.Order.belongsTo(db.Address, {
  foreignKey: "address_id",
  as: "address",
});


db.Order.hasMany(db.OrderItem, {
  foreignKey: "order_id",
  as: "items",
});

db.OrderItem.belongsTo(db.Order, {
  foreignKey: "order_id",
  as: "order",
});

db.Service.hasMany(db.OrderItem, {
  foreignKey: "service_id",
  as: "orderItems",
});

db.OrderItem.belongsTo(db.Service, {
  foreignKey: "service_id",
  as: "service",
});


db.Customer.hasMany(db.Payment, {
  foreignKey: "customer_id",
  as: "payments",
});

db.Payment.belongsTo(db.Customer, {
  foreignKey: "customer_id",
  as: "customer",
});


db.Payment.hasMany(db.Refund, {
  foreignKey: "payment_id",
  as: "refunds",
});

db.Refund.belongsTo(db.Payment, {
  foreignKey: "payment_id",
  as: "payment",
});


db.Customer.hasMany(db.Invoice, {
  foreignKey: "customer_id",
  as: "invoices",
});

db.Invoice.belongsTo(db.Customer, {
  foreignKey: "customer_id",
  as: "customer",
});

db.Provider.hasMany(db.Invoice, {
  foreignKey: "provider_id",
  as: "invoices",
});

db.Invoice.belongsTo(db.Provider, {
  foreignKey: "provider_id",
  as: "provider",
});


db.Category.hasMany(db.Coupon, {
  foreignKey: "category_id",
  as: "coupons",
});

db.Coupon.belongsTo(db.Category, {
  foreignKey: "category_id",
  as: "category",
});


db.Coupon.hasMany(db.CouponUsage, {
  foreignKey: "coupon_id",
  as: "usages",
});

db.CouponUsage.belongsTo(db.Coupon, {
  foreignKey: "coupon_id",
  as: "coupon",
});

db.Customer.hasMany(db.CouponUsage, {
  foreignKey: "customer_id",
  as: "couponUsages",
});

db.CouponUsage.belongsTo(db.Customer, {
  foreignKey: "customer_id",
  as: "customer",
});

db.Order.hasMany(db.CouponUsage, {
  foreignKey: "order_id",
  as: "couponUsages",
});

db.CouponUsage.belongsTo(db.Order, {
  foreignKey: "order_id",
  as: "order",
});


db.Customer.hasMany(db.Review, {
  foreignKey: "customer_id",
  as: "reviews",
});

db.Review.belongsTo(db.Customer, {
  foreignKey: "customer_id",
  as: "customer",
});

db.Provider.hasMany(db.Review, {
  foreignKey: "provider_id",
  as: "reviews",
});

db.Review.belongsTo(db.Provider, {
  foreignKey: "provider_id",
  as: "provider",
});

db.Order.hasOne(db.Review, {
  foreignKey: "order_id",
  as: "review",
});

db.Review.belongsTo(db.Order, {
  foreignKey: "order_id",
  as: "order",
});


db.User.hasMany(db.Notification, {
  foreignKey: "user_id",
  as: "notifications",
});

db.Notification.belongsTo(db.User, {
  foreignKey: "user_id",
  as: "user",
});


db.User.hasMany(db.SupportTicket, {
  foreignKey: "user_id",
  as: "supportTickets",
});

db.SupportTicket.belongsTo(db.User, {
  foreignKey: "user_id",
  as: "user",
});


db.SupportTicket.hasMany(db.SupportMessage, {
  foreignKey: "ticket_id",
  as: "messages",
});

db.SupportMessage.belongsTo(db.SupportTicket, {
  foreignKey: "ticket_id",
  as: "ticket",
});

db.User.hasMany(db.SupportMessage, {
  foreignKey: "sender_id",
  as: "supportMessages",
});

db.SupportMessage.belongsTo(db.User, {
  foreignKey: "sender_id",
  as: "sender",
});


db.User.hasMany(db.AuditLog, {
  foreignKey: "user_id",
  as: "auditLogs",
});

db.AuditLog.belongsTo(db.User, {
  foreignKey: "user_id",
  as: "user",
});


db.Category.hasMany(db.CommissionRule, {
  foreignKey: "category_id",
  as: "commissionRules",
});

db.CommissionRule.belongsTo(db.Category, {
  foreignKey: "category_id",
  as: "category",
});

db.Service.hasMany(db.CommissionRule, {
  foreignKey: "service_id",
  as: "commissionRules",
});

db.CommissionRule.belongsTo(db.Service, {
  foreignKey: "service_id",
  as: "service",
});


db.User.hasMany(db.PlatformSetting, {
  foreignKey: "updated_by",
  as: "updatedPlatformSettings",
});

db.PlatformSetting.belongsTo(db.User, {
  foreignKey: "updated_by",
  as: "updatedByUser",
});

module.exports = db;