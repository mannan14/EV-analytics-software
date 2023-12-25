const axios = require("axios");
require("dotenv").config();
const {
  KMSClient,
  EncryptCommand,
  DecryptCommand,
} = require("@aws-sdk/client-kms");

const client = new KMSClient({
  apiVersion: "2012-10-17",
  region: process.env.REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

let encryptedAccessToken;

async function getAccessTokenFromEnode() {
  const tokenEndpoint = process.env.ENODE_OAUTH_TOKEN_URL; // Replace with the actual token endpoint URL
  const clientId = process.env.ENODE_CLIENTID;
  const clientSecret = process.env.ENODE_CLIENT_SECRET;

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  try {
    const response = await axios.post(
      tokenEndpoint,
      {
        grant_type: "client_credentials",
        // redirect_uri: redirectUri,
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${authHeader}`,
        },
      }
    );

    const accessToken = response.data.access_token;
    console.log("Access Token:", response.data);
    console.log(
      "-----------------------------------------------------------------------------------"
    );
    return accessToken;
  } catch (error) {
    console.error("Error:", error.message);
    throw new Error("Failed to get access token");
  }
}

async function refreshAccessToken() {
  try {
    const newAccessToken = await getAccessTokenFromEnode();
    // V3
    const command = new EncryptCommand({
      // EncryptRequest
      KeyId: process.env.AWS_KMS_KEY,
      Plaintext: Buffer.from(newAccessToken, "utf-8"),
    });
    const encryptedData = await client.send(command);
    // console.log("Encrypted Data: ", encryptedData.CiphertextBlob)

    // Store the encrypted access token in the variable for later retrieval
    encryptedAccessToken = encryptedData.CiphertextBlob;
    return newAccessToken;
  } catch (error) {
    console.error("Error in refresh access token: \n", error);
    throw error;
  }
}

async function getAccessToken() {
  try {
    // Retrieve the encrypted access token from AWS KMS (use the latest one stored in the variable)
    let currentEncryptedAccessToken = encryptedAccessToken;
    // If there is no access token available (for example, during the first call),
    // fetch the new access token and store it in the variable
    if (!currentEncryptedAccessToken) {
      const newAccessToken = await refreshAccessToken();
      return newAccessToken;
    }

    // V3
    const command = new DecryptCommand({
      // DecryptRequest
      KeyId: process.env.AWS_KMS_KEY,
      CiphertextBlob: encryptedAccessToken,
    });
    const decryptedData = await client.send(command);
    const accessToken = new TextDecoder("utf-8").decode(
      decryptedData.Plaintext
    );
    console.log("Decrypted Data: ", decryptedData.Plaintext);
    console.log("token", accessToken);
    return accessToken;
  } catch (error) {
    console.error("Error retrieving or decrypting access token: \n", error);
    throw error;
  }
}

module.exports = {
  getAccessToken,
  refreshAccessToken,
  getAccessTokenFromEnode,
};
