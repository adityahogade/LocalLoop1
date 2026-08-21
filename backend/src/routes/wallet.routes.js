const express = require("express");
const controller = require("../controllers/wallet.controller");
const authenticate = require("../midleware/auth");
const authorize = require("../midleware/authorize");

const router = express.Router();
router.use(authenticate, authorize(2));
router.get("/", controller.getWallet);
router.get("/transactions", controller.listTransactions);
module.exports = router;
