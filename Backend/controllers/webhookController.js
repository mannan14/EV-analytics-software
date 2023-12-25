const crypto = require("crypto");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

const dbClient = new DynamoDBClient({
  region: process.env.REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const docClient = DynamoDBDocumentClient.from(dbClient);
const tableName = process.env.DYNAMODB_TABLE;

const { ENODE_WEBHOOK_SECRET } = require("../utils/webhookEventFunction");
const client = new SQSClient({
  apiVersion: "2012-11-05",
  region: process.env.REGION,
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
});

const getWebhooks = async (req, res) => {
  try {
    // Process the payload here
    const enodeSignature = Buffer.from(req.get("X-Enode-Signature"), "utf8");

    if (!enodeSignature) {
      res.status(400).send("X-Enode-Signature header is missing");
      return;
    }
    // Compute signature using your secret and the request payload
    const payload = JSON.stringify(req.body);
    const hmac = crypto.createHmac("sha1", ENODE_WEBHOOK_SECRET);
    const digest = Buffer.from(
      "sha1=" + hmac.update(payload).digest("hex"),
      "utf8"
    );

    // Check whether they match, using timing-safe equality (don't use ==)
    if (!crypto.timingSafeEqual(digest, enodeSignature)) {
      throw new Error("Signature invalid in firehose/webhook");
    }
    // res.status(200).send("Webhook received successfully");
    console.log("Received webhook payload", req.body);
    const events = req.body;
    // Respond with a success status code
    res.status(200).send("Webhook received successfully");

    // when update webhook is triggered check if the vehcile exists, if yes pass the webhook to the SQS else retry after waiting 3 seconds
    if (events[0].event === "user:vehicle:updated") {
      // Retry logic with a maximum of 5 attempts
      const vehicleFound = await retryCheckIfVehicleExists(events, 5);

      if (!vehicleFound) {
        console.log('Vehicle not found after retries. Discarding webhook event.');
        // Perform any cleanup or additional actions when the vehicle is not found after max retries
        return;
      }

      // console.log('Vehicle found!'); // let the webhook pass to the SQS
    }

    // Send the payload to SQS for further processing
    const command = new SendMessageCommand({
      MessageBody: JSON.stringify(events),
      QueueUrl: process.env.AWS_SQS_QUEUE_URL,
    });
    const response = await client.send(command);
    console.log("Message sent to SQS: ", response.MessageId);
  } catch (error) {
    console.error("Error handling webhook:", error.message);
    // Respond with an error status code
    res.status(500).send("Error handling webhook");
  }
};

async function retryCheckIfVehicleExists(events, maxRetries) {
  let count = 0;

  async function checkIfVehicleExistsWithRetry() {
    const vehicleExists = await checkIfVehicleExists(events);
    return vehicleExists;
  }

  async function retry() {
    if (count < maxRetries) {
      const vehicleExists = await checkIfVehicleExistsWithRetry();

      if (!vehicleExists) {
        count++;
        console.log(`Vehicle not found. Retrying (${count}/${maxRetries}) in 10 seconds...`);
        await sleep(10000); // Wait for 10 seconds before retrying
        return retry();
      } else {
        console.log('Vehicle found!');
        return true;
      }
    } else {
      console.log(`Vehicle not found after ${maxRetries} attempts.`);
      return false;
    }
  }

  // Start the retry process
  return retry();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkIfVehicleExists(events) {
  const vehicleId = events[0].vehicle.id;
  const userId = events[0].user.id;

  console.log("vehicleId:", vehicleId);
  console.log("userId:", userId);

  try {
    const userData = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { userId: userId },
      })
    );

    if (userData.Item) {
      const userVehiclesList = userData.Item?.vehicles || [];
      const vehicleExists = userVehiclesList.some((v) => v.id === vehicleId);
      console.log("vehicleExists:", vehicleExists);
      return vehicleExists;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error checking if vehicle exists:", error.message);
    throw error;
  }
}

// async function checkIfVehicleExists(events) {
//   // console.group("received Event in checkIfVehicleExists:", events);
//   const vehicleId = events[0].vehicle.id;
//   const userId = events[0].user.id;

//   console.log("vehicleId:", vehicleId);
//   console.log("userId:", userId);

//   const userData = await docClient.send(
//     new GetCommand({
//       TableName: tableName,
//       Key: { userId: userId },
//     })
//   );

//   // console.log("userData", userData);

//   if (userData.Item) {
//     // user is present
//     const userVehiclesList = userData.Item?.vehicles || [];
//     // console.log("userVehicleList:", userVehiclesList);

//     const vehicleExists = userVehiclesList.some((v) => v.id === vehicleId);
//     console.log("vehicleExists:", vehicleExists);
//     return vehicleExists;
//   } else {
//     return false;
//   }
// }

module.exports = {
  getWebhooks,
};
