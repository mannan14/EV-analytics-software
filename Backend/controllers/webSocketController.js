const { v4: uuidv4 } = require("uuid");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({
  region: process.env.REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.DYNAMODB_TABLE_1;

const generateAndSaveWebsocketToken = async (req, res) => {
  const userId = req.authUserId; // Extract the user ID from the authenticated user
  const uniqueToken = uuidv4(); // Generate a unique token
  const isUsed = false;

  // Define the item to be stored in DynamoDB
  const item = {
    userId: userId,
    token: uniqueToken,
    isUsed: isUsed,
  };

  // Prepare the PutCommand to store the item
  const putParams = {
    TableName: tableName,
    Item: item,
  };

  try {
    // Using the DynamoDBDocumentClient to put the item in the table
    await docClient.send(new PutCommand(putParams));
    res.json({
      status: 200,
      message: "Token saved in DB",
      user: userId,
      uniqueToken,
    });
  } catch (error) {
    console.error("DynamoDB Error:", error);
    res.status(500).json({ message: "Error storing data in DynamoDB" });
  }
};

module.exports={
  generateAndSaveWebsocketToken
}
