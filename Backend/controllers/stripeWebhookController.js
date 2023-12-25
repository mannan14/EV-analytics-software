const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// const { STRIPE_WEBHOOK_SECRET } = require("../utils/stripeWebhook");

const {
  handleCheckoutSessionCompleted,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  handleCustomerSubscriptionDeleted,
  handleCustomerDeleted
} = require("../utils/stripeWebhookHandler");

const endpointSecret = process.env.STRIPE_WEBHOOK_ENDPOINT_SECRET; //get it from stripe webhook dashboard

const stripeWebhookHandler = async (request, response) => {
  let event = request.body;

  if (endpointSecret) {
    // Get the signature sent by Stripe
    const signature = request.headers["stripe-signature"];
    // console.log("signature:", signature);
    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        signature,
        endpointSecret
      );
    } catch (err) {
      console.error(`⚠️  Webhook signature verification failed.`, err.message);
      return response.sendStatus(400);
    }
  }

  // console.log("event body after:", event);

  // Handle the event
  switch (event.type) {
    // case "payment_intent.succeeded":
    //   const paymentIntent = event.data.object;
    //   console.log("PaymentIntent was successful!");
    //   break;
    // case "payment_method.attached":
    //   const paymentMethod = event.data.object;
    //   console.log("PaymentMethod was attached to a Customer!", paymentMethod);
    //   break;
    // case "charge.succeeded":
    //   console.log("charge.succeeded event");
    //   // Then define and call a method to handle the successful payment intent.
    //   // handlePaymentIntentSucceeded(paymentIntent);
    //   break;
    // case "charge.failed":
    //   console.log("charge.failed event");
    //   // const charge = event.data.object;
    //   // Then define and call a method to handle the successful attachment of a PaymentMethod.
    //   // handlePaymentMethodAttached(paymentMethod);
    //   break;

    // Extra Events:
    // Customer events
    // case "customer.created":
    //   console.log(`customer.created event`);
    //   break;

    // case "customer.updated":
    //   console.log(`customer.updated event`, event.data.object);
    //   break;

    case "customer.deleted":
      console.log(`customer.deleted event`, event.data.object);
      await handleCustomerDeleted(event.data.object);
      break;

    // customer.subscription events
    // case "customer.subscription.created":
    //   console.log(`customer.subscription.created event`);
    //   break;

    // case "customer.subscription.updated":
    //   console.log(`customer.subscription.updated event`, event.data.object);
    //   break;

    case "customer.subscription.deleted":
      console.log(`customer.subscription.deleted event`, event.data.object);
      await handleCustomerSubscriptionDeleted(event.data.object);
      break;

    // payment_intent Events
    // case "payment_intent.created":
    //   console.log(`payment_intent.created event`);
    //   break;

    // case "payment_intent.requires_action":
    //   console.log(`payment_intent.requires_action event`);
    //   break;

    // Checkout Events
    case "checkout.session.completed":
      console.log(`checkout.session.completed event`);
      await handleCheckoutSessionCompleted(event.data.object);
      break;

    // case "checkout.session.expired":
    //   console.log(`checkout.session.expired event`);
    //   break;

    // Invoice Events
    case "invoice.paid":
      console.log(`invoice.paid event`, event.data.object);
      await handleInvoicePaid(event.data.object);
      break;

    // case "invoice.finalized":
    //   console.log(`invoice.finalized event`);
    //   break;

    // case "invoice.updated":
    //   console.log(`invoice.updated event`);
    //   break;

    // case "invoice.payment_succeeded":
    //   console.log(`invoice.payment_succeeded event`);
    //   break;

    case "invoice.payment_failed":
      console.log(`invoice.payment_failed event`, event.data.object);
      await handleInvoicePaymentFailed(event.data.object);
      break;

    case "invoice.payment_action_required":
      console.log(`invoice.payment_action_required event`, event.data.object);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  response.json({ received: true });
};

module.exports = {
  stripeWebhookHandler,
};
