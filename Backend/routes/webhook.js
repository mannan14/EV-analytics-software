const express = require("express");

const router = express.Router();

const { getWebhooks } = require("../controllers/webhookController");

/* PUBLIC ROUTES */
router.post(`/firehose`, getWebhooks);

module.exports = router;
