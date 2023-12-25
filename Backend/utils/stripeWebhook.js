// // THIS CODE IS TO CREATE THE WEBHOOK MANUALLY
// // NOT USING IT FOR NOW, USING DASHBOARD DIRECTLY TO CREATE THE WEBHOOK AND TO GENERATE THE SECERT

// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// let STRIPE_WEBHOOK_SECRET;
// let stripeWebhookIds = [];

// const runStripeWebhook = async () => {
//   const webhookEndpoint = await stripe.webhookEndpoints.create({
//     enabled_events: ["charge.succeeded", "charge.failed"],
//     url: "https://0531-103-177-16-35.ngrok.io/stripe-webhook/endpoint",
//   });

//   STRIPE_WEBHOOK_SECRET = webhookEndpoint.secret;
//   console.log("stripe webhookendpoint response:", webhookEndpoint);
//   console.log("stripe webhookId:", webhookEndpoint.id);
//   console.log("stripe secret:", webhookEndpoint.secret);
//   stripeWebhookIds.push(webhookEndpoint.id);
//   const listOfWebhooks = await listAllStripeWebhooks();
//   console.log(listOfWebhooks);
//   listOfWebhooks.map(item => {
//     if(item.id !== webhookEndpoint.id) {
//       deleteStripeWebhook(item.id);
//     }
//   });

//   console.log("stripe id array:", stripeWebhookIds);
// };

// const updateStripeWebhook = async (id) => {
//   const webhookEndpoint = await stripe.webhookEndpoints.update(id, {
//     url: "https://0531-103-177-16-35.ngrok.io/stripe-webhook/endpoint",
//   });

//   console.log("updated webhookEndpoint", webhookEndpoint);
// };

// const listAllStripeWebhooks = async () => {
//   const webhookEndpoints = await stripe.webhookEndpoints.list({
//     limit: 16,
//   });

//   console.log("list all webhooks:", webhookEndpoints);
//   const listOfWebhooks = webhookEndpoints.data;
//   return listOfWebhooks;
// };

// const deleteStripeWebhook = async(id) => {
//   const deleted = await stripe.webhookEndpoints.del(id);

//   console.log("delete response", deleted);
// };

// module.exports = {
//   runStripeWebhook,
//   updateStripeWebhook,
//   listAllStripeWebhooks,
//   deleteStripeWebhook,
//   STRIPE_WEBHOOK_SECRET,
//   stripeWebhookIds
// };
