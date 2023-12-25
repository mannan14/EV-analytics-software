const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({
  region: process.env.REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.DYNAMODB_TABLE_2;

// Stripe
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const YOUR_DOMAIN = "http://localhost:3000";

const createCheckoutSession = async (req, res) => {
  try {
    const { priceId, quantity } = req.body;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          adjustable_quantity: {
            enabled: true,
            minimum: 1,
            maximum: 99,
          },
          quantity: quantity,
        },
      ],
      success_url: `${YOUR_DOMAIN}/subscription/result?result=SUCCESS&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${YOUR_DOMAIN}/subscription/result?result=FAILURE&session_id={CHECKOUT_SESSION_ID}`,
    });

    // res.redirect(303, session.url);
    res.status(200).json({ sessionId: session.id, sessionURL: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error.message);
    res.status(500).json({ error: "Error creating checkout session" });
  }
};

const getSessionDetails = async (req, res) => {
  try {
    const { id } = req.query;
    const session = await stripe.checkout.sessions.retrieve(id, {
      expand: ["payment_intent"],
    });
    res.json({ session });
  } catch (error) {
    console.error("Error retrieving session:", error.message);
    res.status(500).json({ error: "Error retrieving session" });
  }
};

const listLineItems = async (req, res) => {
  try {
    const { id } = req.query;
    const lineItems = await stripe.checkout.sessions.listLineItems(id);
    res.json({ lineItems });
  } catch (error) {
    console.error("Error listing line items:", error.message);
    res.status(500).json({ error: "Error listing line items" });
  }
};

const getCustomerDetails = async (req, res) => {
  try {
    const { email } = req.query;

    // Validate that email is provided
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Define the parameters for the get operation
    const params = {
      TableName: tableName,
      Key: {
        customer_email: email,
      },
    };

    // Get the item from the table
    const result = await docClient.send(new GetCommand(params));

    // Check if the item exists
    if (!result.Item) {
      return res
        .status(404)
        .json({ error: "No data found for the provided email" });
    }

    // Return the result
    res.status(200).json(result.Item);
  } catch (error) {
    console.error("Error fetching subscription details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getPaymentAndSubscriptionStatus = async (req, res) => {
  try {
    const { email } = req.query;

    // Validate that email is provided
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Define the parameters for the get operation
    const params = {
      TableName: tableName,
      Key: {
        customer_email: email,
      },
    };

    // Get the item from the table
    const result = await docClient.send(new GetCommand(params));

    // Check if the item exists
    if (!result.Item) {
      return res
        .status(404)
        .json({ error: "No data found for the provided email" });
    }

    // Return the result
    res.status(200).json({
      paymentStatus: result.Item.paymentStatus,
      subscriptionStatus: result.Item.subscriptionStatus,
    });
  } catch (error) {
    console.error("Error fetching subscription details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteCustomerFromStripe = async (req, res) => {
  const { email } = req.query;

  // Validate that email is provided
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  console.log("email stripe delete:", email);

  try {
    // Retrieve the customer ID from Stripe based on the email
    const customers = await stripe.customers.list({ email: email });
    const customer = customers.data[0];
    console.log("customers:", customers);
    console.log("customer:", customer);

    // Check if a customer with the given email exists
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Delete the customer from Stripe
    await stripe.customers.del(customer.id);

    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const createCustomerPortal = async (req, res) => {
  try {
    const { email } = req.body;
    // Fetch customer by email
    const customer = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (customer.data.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const customerId = customer.data[0].id;

    // Create a billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: "http://localhost:3000/dashboard",
    });

    res.status(200).json({ sessionId: session.id, sessionURL: session.url });
  } catch (error) {
    console.error("Error creating customer portal:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createCheckoutSession,
  getSessionDetails,
  listLineItems,
  getCustomerDetails,
  getPaymentAndSubscriptionStatus,
  deleteCustomerFromStripe,
  createCustomerPortal,
};
