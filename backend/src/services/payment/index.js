const MockPaymentProvider = require("./mockProvider");

// Force razorpay in tests, but default to mock in development/production
const providerType = process.env.NODE_ENV === "test" ? "razorpay" : (process.env.PAYMENT_PROVIDER || "mock");
let currentProvider;

if (providerType !== "razorpay") {
  currentProvider = new MockPaymentProvider();
}

module.exports = {
  getProvider: () => currentProvider,
  setProvider: (provider) => { currentProvider = provider; }
};
