const express = require("express");
const router = express.Router();

const { stripeWebhookHandler } = require("../controllers/stripeWebhookController");

router.post("/endpoint", express.raw({ type: "application/json" }), stripeWebhookHandler);

module.exports = router;
