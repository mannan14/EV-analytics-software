require("dotenv").config();
const axios = require("axios");
const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const client = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const dynamoDBClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.DYNAMODB_TABLE;

const BUCKET_NAME = process.env.IMAGES_BUCKET;
const s3Client = new S3Client({
  region: process.env.REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_ACCESS_KEY_ID,
});

const getSignedImageURL = async (req, res) => {
  const imageName = req.params.imageName;
  const S3key = `userImage/${imageName}`;

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: S3key,
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn: 36000 });
    console.log("getImageUrl", url);
    res.status(200).send(url);
  } catch (error) {
    res.status(500).send("error in: " + error);
  }
};

const getImageSignedUplaodURL = async (req, res) => {
  const imageName = req.body.imageName;
  const type = req.body.type;
  const S3key = `userImage/${imageName}`;

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: S3key,
      ContentType: type,
    });
    const url = await getSignedUrl(s3Client, command);
    console.log("postImageUrl", url);
    res.status(200).send(url);
  } catch (error) {
    console.error("error in " + error);
  }
};

const deleteUserImage = async (req, res) => {
  const imageName = req.params.imageName;
  const S3key = `userImage/${imageName}`;

  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: S3key,
      })
    );

    console.log(`Deleted image: ${imageName}`);
    res.status(204).send(); // Respond with a 204 (No Content) status on successful deletion
  } catch (error) {
    console.error("Error deleting image: " + error);
    res.status(500).send("Error deleting image: " + error);
  }
};

const getParticularVehicle = async (req, res) => {
  const userId = req.params.userId;
  const vehicleId = req.params.vehicleId;

  try {
    // Define the query parameters
    const params = {
      TableName: tableName,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
    };

    const command = new QueryCommand(params);
    const data = await dynamoDBClient.send(command);

    // Perform the query operation to get user data
    if (data.Items.length > 0) {
      const user = data.Items[0];
      // console.log("user", user);
      // Find the vehicle with the matching vehicleId in the vehicles array
      const vehicle = user.vehicles.find((v) => v.id === vehicleId);

      // Find the corresponding processed data in the vehicles_processed_data object
      const processedData = user.vehicles_processed_data[vehicleId];

      if (vehicle && processedData) {
        // If both vehicle and processedData are found, send the response
        res.json({
          vehicleData: vehicle,
          processedData: processedData,
          userId,
          vehicleId,
        });
      } else {
        res
          .status(404)
          .send(
            "Server:(UserData) Vehicle not found in /users/:userId/:vehicleId"
          );
      }
    } else {
      res
        .status(404)
        .send("Server:(UserData) User not found in /users/:userId/:vehicleId");
    }
  } catch (err) {
    console.error("Error:", err);
    res
      .status(500)
      .send("Server:(UserData) An error occurred in get user parameter");
  }
};

const getTemperature = async (req, res) => {
  try {
    const userLocation = req.body.userLocation;
    console.log(req.body);
    if (!userLocation) {
      return res
        .status(400)
        .json({ error: "userLocation parameter is required" });
    }
    const key = process.env.WEATHER_API_KEY;

    const apiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${key}&q=${userLocation
      .replace(/,/g, "")
      .replace(/ /g, "+")}`;

    const response = await axios.get(apiUrl);
    const weatherData = response.data;

    const minTemperature = weatherData.forecast.forecastday[0].day.mintemp_c;
    const maxTemperature = weatherData.forecast.forecastday[0].day.maxtemp_c;

    res.json({ minTemperature, maxTemperature });
  } catch (error) {
    console.error("Error fetching weather data:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching weather data" });
  }
};

module.exports = {
  getSignedImageURL,
  getImageSignedUplaodURL,
  deleteUserImage,
  getParticularVehicle,
  getTemperature,
};
