// stripe webhook event handler functions
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  QueryCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({
  region: process.env.REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.DYNAMODB_TABLE_2;

async function handleCheckoutSessionCompleted(data) {
  try {
    console.log("handleCheckoutSessionCompleted:", data);
    const email = data.customer_details.email;
    const customer_Id = data.customer;
    const subscription_Id = data.subscription;
    const session_Id = data.id;
    const paymentStatus = data.payment_status;
    const amount_total = data.amount_total / 100;
    const currency = data.currency;
    const invoice_Id = data.invoice;

    console.log("Email:", email);
    console.log("Customer ID:", customer_Id);
    console.log("Subscription ID:", subscription_Id);
    console.log("Session ID:", session_Id);
    console.log("Payment Status:", paymentStatus);
    console.log("Amount Total:", amount_total);
    console.log("Currency:", currency);
    console.log("Invoice ID:", invoice_Id);

    if (paymentStatus === "paid") {
      //retreiving subscription data
      const subscriptionData = await stripe.subscriptions.retrieve(
        subscription_Id
      );

      const startDate = new Date(
        subscriptionData.current_period_start * 1000
      ).toISOString();
      const endDate = new Date(
        subscriptionData.current_period_end * 1000
      ).toISOString();
      const priceId = subscriptionData.items.data[0].price.id;
      const productId = subscriptionData.items.data[0].price.product;
      const quantity = subscriptionData.quantity;
      const subscriptionStatus = subscriptionData.status;

      console.log("Start Date:", startDate);
      console.log("End Date:", endDate);
      console.log("Price ID:", priceId);
      console.log("Product ID:", productId);
      console.log("Quantity:", quantity);
      console.log("Subscription Status:", subscriptionStatus);

      const params = {
        TableName: tableName,
        Item: {
          customer_email: email,
          sessionId: session_Id,
          customerId: customer_Id,
          subscriptionId: subscription_Id,
          paymentStatus: paymentStatus,
          amountTotal: amount_total,
          currency: currency,
          invoiceId: invoice_Id,
          startDate: startDate,
          endDate: endDate,
          priceId: priceId,
          productId: productId,
          quantity: quantity,
          subscriptionStatus: subscriptionStatus,
        },
      };

      // Save user data to DynamoDB
      await docClient.send(new PutCommand(params));
      console.log(`User data saved for customerId: ${customer_Id}`);
    } else {
      console.log("can't save data as paymentStatus:", paymentStatus);
    }
  } catch (error) {
    console.error("Error saving user data to DynamoDB:", error.message);
    // Handle error appropriately
  }
}

async function handleInvoicePaid(data) {
  try {
    const customerEmail = data.customer_email;
    const subscriptionId = data.subscription;
    const paymentStatus = data.status;
    const invoiceId = data.id;

    // Check if the user is present in DynamoDB
    const getUserParams = {
      TableName: tableName,
      Key: {
        customer_email: customerEmail,
      },
    };

    const userExists = await docClient.send(new GetCommand(getUserParams));

    if (userExists.Item) {
      // User is present in DynamoDB, fetch updated subscription status from Stripe
      const subscriptionData = await stripe.subscriptions.retrieve(
        subscriptionId
      );
      console.log(
        "retreived sub data after paid:",
        subscriptionData.items.data
      );

      const startDate = new Date(
        subscriptionData.current_period_start * 1000
      ).toISOString();
      const endDate = new Date(
        subscriptionData.current_period_end * 1000
      ).toISOString();
      const priceId = subscriptionData.items.data[0].price.id;
      const productId = subscriptionData.items.data[0].price.product;
      const quantity = subscriptionData.quantity;
      const updatedSubscriptionStatus = subscriptionData.status;
      const updatedAmount =
        (subscriptionData.items.data[0].price.unit_amount * quantity) / 100;

      console.log("Start Date paid:", startDate);
      console.log("End Date:", endDate);
      console.log("Price ID:", priceId);
      console.log("Product ID:", productId);
      console.log("Quantity:", quantity);
      console.log("Subscription Status:", updatedSubscriptionStatus);
      console.log("Invoice id paid:", invoiceId);
      console.log("updatedAmount:", updatedAmount);

      // Update the subscription status in the database
      const updateParams = {
        TableName: tableName,
        Key: {
          customer_email: customerEmail,
        },
        UpdateExpression:
          "SET amountTotal = :updatedAmount, subscriptionStatus = :status, paymentStatus = :paymentStatus, startDate = :startDate, endDate = :endDate, priceId = :priceId, productId = :productId, quantity = :quantity, invoiceId = :invoiceId",
        ExpressionAttributeValues: {
          ":status": updatedSubscriptionStatus,
          ":startDate": startDate,
          ":endDate": endDate,
          ":priceId": priceId,
          ":productId": productId,
          ":quantity": quantity,
          ":paymentStatus": paymentStatus,
          ":invoiceId": invoiceId,
          ":updatedAmount": updatedAmount,
        },
      };

      await docClient.send(new UpdateCommand(updateParams));
      console.log(`Subscription status updated for customer: ${customerEmail}`);
    } else {
      // User not found in DynamoDB, handle accordingly
      console.log(`User not found in DynamoDB`);
    }
  } catch (error) {
    console.error("Error handling invoice.paid event:", error.message);
    // Handle error appropriately
  }
}

async function handleInvoicePaymentFailed(data) {
  try {
    const customerEmail = data.customer_email;
    const subscriptionId = data.subscription;
    const customerId = data.customer;
    const paymentStatus = data.status;

    // Check if the user is present in DynamoDB
    const getUserParams = {
      TableName: tableName,
      Key: {
        customer_email: customerEmail,
      },
    };

    const userExists = await docClient.send(new GetCommand(getUserParams));

    if (userExists.Item) {
      // User is present in DynamoDB, update subscriptionStatus to inactive
      const subscriptionData = await stripe.subscriptions.retrieve(
        subscriptionId
      );
      console.log("retreived sub data after paid:", subscriptionData);
      const updatedSubscriptionStatus = subscriptionData.status;

      const updateParams = {
        TableName: tableName,
        Key: {
          customer_email: customerEmail,
        },
        UpdateExpression:
          "SET subscriptionStatus = :status, paymentStatus = :paymentStatus",
        ExpressionAttributeValues: {
          ":status": updatedSubscriptionStatus,
          ":paymentStatus": paymentStatus,
        },
      };

      await docClient.send(new UpdateCommand(updateParams));
      console.log(
        `Subscription status set to inactive for customer: ${customerEmail}`
      );
    } else {
      // User is not present in DynamoDB, delete from Stripe
      // await stripe.customers.del(customerId);
      // await stripe.subscriptions.del(subscriptionId);
      console.log(`User not found in DynamoDB`);
    }
  } catch (error) {
    console.error(
      "Error handling invoice.payment_failed event:",
      error.message
    );
    // Handle error appropriately
  }
}

async function handleCustomerSubscriptionDeleted(data) {
  try {
    const customerId = data.customer;

    // Check if the user is present in DynamoDB using the index
    const getUserParams = {
      TableName: tableName,
      IndexName: "customerId-index",
      KeyConditionExpression: "customerId = :customerId",
      ExpressionAttributeValues: {
        ":customerId": customerId,
      },
    };

    const userExists = await docClient.send(new QueryCommand(getUserParams));

    if (
      userExists.Items &&
      Array.isArray(userExists.Items) &&
      userExists.Items.length > 0
    ) {
      // User is present in DynamoDB, update subscriptionStatus to canceled
      const updateParams = {
        TableName: tableName,
        Key: {
          customer_email: userExists.Items[0].customer_email,
        },
        UpdateExpression: "SET subscriptionStatus = :status",
        ExpressionAttributeValues: {
          ":status": data.status,
        },
      };

      await docClient.send(new UpdateCommand(updateParams));

      const stripeCustomer = await stripe.customers.retrieve(customerId);
      console.log("Retrieved stripe customer:", stripeCustomer);

      if (!stripeCustomer.deleted) {
        await stripe.customers.del(customerId);
        console.log(`User deleted from stripe with customerId: ${customerId}`);
      } else {
        console.log(
          "User already deleted from stripe, no user found with the customer ID"
        );
      }

      console.log(
        `Subscription status set to canceled for customer: ${userExists.Items[0].customer_email}`
      );
    } else {
      // User not found in DynamoDB, handle accordingly
      console.log(`User not found in DynamoDB for customerId: ${customerId}`);
    }
  } catch (error) {
    console.error("Error handling customer.subscription.deleted event:", error);
  }
}

async function handleCustomerDeleted(data) {
  try {
    const customerEmail = data.email;

    // Check if the user is present in DynamoDB
    const getUserParams = {
      TableName: tableName,
      Key: {
        customer_email: customerEmail,
      },
    };

    const userExists = await docClient.send(new GetCommand(getUserParams));

    if (userExists.Item) {
      // User is present in DynamoDB, delete the user
      const deleteParams = {
        TableName: tableName,
        Key: {
          customer_email: customerEmail,
        },
      };

      await docClient.send(new DeleteCommand(deleteParams));

      console.log(`Customer deleted from DynamoDB: ${customerEmail}`);
    } else {
      // User not found in DynamoDB, no action needed
      console.log(`User not found in DynamoDB`);
    }
  } catch (error) {
    console.error("Error handling customer.deleted event:", error.message);
    // Handle error appropriately
  }
}

module.exports = {
  handleCheckoutSessionCompleted,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  handleCustomerSubscriptionDeleted,
  handleCustomerDeleted,
};
