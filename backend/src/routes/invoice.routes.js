const express = require("express");
const controller = require("../controllers/invoice.controller");
const authenticate = require("../midleware/auth");
const authorize = require("../midleware/authorize");

const router = express.Router();
router.use(authenticate);
router.get("/", controller.list);
router.get("/:id/pdf", controller.getPdf);
module.exports = router;
