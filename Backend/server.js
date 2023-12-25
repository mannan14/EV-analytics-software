const express = require("express");
const cors = require("cors");
// const bodyParser = require("body-parser");
const cron = require("node-cron");
require("dotenv").config();

const app = express();
// app.use(bodyParser.json());
app.use(cors());
app.use((req, res, next) => {
  if (req.originalUrl === '/stripe-webhook/endpoint') {
    next(); // Do nothing with the body because I need it in a raw state.
  } else {
    express.json()(req, res, next);  // ONLY do express.json() if the received request is NOT a WebHook from Stripe.
  }
});

const PORT = process.env.PORT || 5000;

const userAuth = require("./routes/userAuth");
const enode = require("./routes/enode");
const webhook = require("./routes/webhook");
const userData = require("./routes/userData");
const webSocket = require("./routes/webSocket");
const subscription = require("./routes/subscription");
const stripeWebhook = require("./routes/stripeWebhook");
const { refreshAccessToken } = require("./utils/accessToken");
const {
  runWebHook,
  updateWebHook,
  webhookId,
} = require("./utils/webhookEventFunction");

// const { runStripeWebhook, stripeWebhookIds, listAllStripeWebhooks } = require("./utils/stripeWebhook");

// https://dev.to/aws-builders/manage-webhooks-at-scale-with-aws-serverless-fof
console.log("Server.js: ", webhookId);
let task = cron.schedule("*/30 * * * *", async () => {
  try {
    const newAccessToken = await refreshAccessToken();
    // updateWebhookSecret()
    updateWebHook();
    console.log("Access token refreshed successfully.", newAccessToken);
  } catch (error) {
    console.error("Error refreshing access token:", error);
  }
});

if (webhookId.length == 0) {
  runWebHook();
}

// if(stripeWebhookIds.length == 0){
//   runStripeWebhook();
// }
// runStripeWebhook();
// listAllStripeWebhooks();

task.start();

app.use("/auth", userAuth);
app.use("/webhooks", webhook);
app.use("/vehicles", enode);
app.use("/user-data", userData);
app.use("/websocket", webSocket);
app.use("/subscription", subscription); 
app.use("/stripe-webhook", stripeWebhook); 

app.get("/check", (req, res) => {
  return res.status(200).json({ message: "API working" });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
