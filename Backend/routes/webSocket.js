const express = require("express");
const router = express.Router();

const { generateAndSaveWebsocketToken } = require("../controllers/webSocketController");
const { authenticateToken } = require("../middleware/authenticateToken");

/*PROTECTED ROUTES */
router.get("/generate-token", authenticateToken, generateAndSaveWebsocketToken);

module.exports = router;
