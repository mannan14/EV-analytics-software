require("dotenv").config();
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
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
const tableName = process.env.DYNAMODB_TABLE;
const tableName2 = process.env.DYNAMODB_TABLE_2;

const signup = async (req, res) => {
  try {
    const { email, country, city, state, name, userId, vehicles } =
      req.body;

    const params = {
      TableName: tableName,
      Item: {
        userId: userId,
        email: email,
        // owner_type: owner_type,
        country: country,
        city: city,
        state: state,
        name: name,
        vehicles: vehicles,
      },
    };

    const command = new PutCommand(params);
    const response = await docClient.send(command);
    res.sendStatus(201);
    console.log("Item created successfully", response.data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to create item" });
  }
};

const isValidEmail = async (req, res) => {
  //first checking if the email is present in the subscription table
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const getCommandParams = {
    TableName: tableName2,
    Key: {
      customer_email: email,
    },
  };

  try {
    const result = await docClient.send(new GetCommand(getCommandParams));
    res.status(200).json({ isValidEmail: !!result.Item });
  } catch (error) {
    console.error("Error checking email validity:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllUsers = async (req, res) => {
  // Define the scan parameters
  try {
    const params = {
      TableName: tableName,
    };
    const command = new ScanCommand(params);
    docClient.send(command).then((response) => {
      console.log(response);
      const users = response.Items;
      res.json(users);
    });
  } catch (error) {
    console.error("Error:", err);
    res.status(500).send("An error occurred");
  }
};

const getUserData = async (req, res) => {
  const userId = req.params.userId;

  try {
    const command = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
      // ConsistentRead: true,
    });
    const response = await docClient.send(command);

    if (response.Items.length > 0) {
      console.log(response.Items.length);
      const user = response.Items[0];
      res.status(200).json(user);
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred in get user parameter");
  }
};

const deleteUserDataFromDB = async (req, res) => {
  const userId = req.params.userId;

  try {
    const command = new DeleteCommand({
      TableName: tableName,
      Key: {
        userId: userId,
      },
    });
    docClient
      .send(command)
      .then((response) => {
        console.log("Deleted User from DynamoDb" + response);
        res.json(response);
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (error) {
    res.status(500).send("An error occurred in delete user in DynamoDb");
    console.error("Error:", error);
  }
};

const updateUserData = async (req, res) => {
  const { userId } = req.params;
  const { country, city, state, email, name } = req.body;

  try {
    const params = {
      TableName: tableName,
      Key: { userId: userId },
      UpdateExpression:
        "SET #country = :country, #city = :city, #state = :state, #email = :email, #name = :name",
      ExpressionAttributeNames: {
        "#country": "country",
        "#city": "city",
        "#state": "state",
        "#email": "email",
        // "#owner_type": "owner_type",
        "#name": "name",
      },
      ExpressionAttributeValues: {
        ":country": country,
        ":city": city,
        ":state": state,
        ":email": email,
        // ":owner_type": owner_type,
        ":name": name,
      },
    };

    const command = new UpdateCommand(params);
    docClient
      .send(command)
      .then((response) => {
        // console.log(response);
        console.log("User details updated successfully:", response);
        return res.status(200).json({
          message: "User details updated successfully",
          // user: response.Attributes,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (error) {
    console.error("Error updating user details:", error);
    return res.status(500).json({ error: "Failed to update user details" });
  }
};

module.exports = {
  signup,
  getAllUsers,
  getUserData,
  deleteUserDataFromDB,
  updateUserData,
  isValidEmail,
};
