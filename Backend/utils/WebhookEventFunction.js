const axios = require("axios");
const crypto = require("crypto");
const { getAccessToken } = require("./accessToken");

// let ENODE_WEBHOOK_SECRET = "d5c6678294dd06a24208a353d0ab2bbf0748aa4a5d76b399a6366d96dc95ac71";
let ENODE_WEBHOOK_SECRET = crypto.randomBytes(32).toString("hex");
let webhookId = [];
let webhookData;

async function listWebHook() {
  try {
    const accessToken = await getAccessToken();

    const response = await axios.get(
      `${process.env.ENODE_API_URL}/webhooks`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 200) {
      console.log("Webhook list:", response.data);

      webhookData = response.data.data;

      if (webhookId.length === 1) {
        for (const element of webhookData) {
          if (element.id !== webhookId[0]) {
            await deleteWebHook(element.id);
          }
        }
      } else {
        console.log("Inner else statement run.");
      }

      console.log("webhookID", webhookId);
    } else {
      console.error("Unexpected response in listing webhook:", response.status);
      console.log("Outer else statement run.");
    }
  } catch (error) {
    console.error("Error in listing webhook", error);
    console.log("webhook id and webhook data", webhookId, "\n", webhookData);
  }
}

async function runWebHook() {
  try {
    const accessToken = await getAccessToken();

    const data = {
      secret: ENODE_WEBHOOK_SECRET,
      url: `${process.env.NGROK_PUBLIC_URL}/webhooks/firehose`,
      apiVersion: "2023-08-01",
      events: ["*"],
    };

    const response = await axios.post(
      `${process.env.ENODE_API_URL}/webhooks`,
      data,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("response of runWebHook() function: \n", response.data);

    if (response.status === 200) {
      console.log("Webhook created successfully", response.data);
      webhookId.push(response.data.id);
      listWebHook();
    } else {
      console.error("Unexpected response:", response.status);
      listWebHook();
    }
  } catch (error) {
    console.error(
      "Error in setWebhook \n",
      error.response.data,
      ENODE_WEBHOOK_SECRET
    );
    listWebHook();
  }
}

async function updateWebHook() {
  try {
    const accessToken = await getAccessToken();
    // ENODE_WEBHOOK = crypto.randomBytes(32).toString("hex");

    const data = {
      secret: ENODE_WEBHOOK_SECRET,
      url: `${process.env.NGROK_PUBLIC_URL}/webhooks/firehose`,
      apiVersion: "2023-08-01",
      events: ["*"],
    };

    const response = await axios.patch(
      `${process.env.ENODE_API_URL}/webhooks/${webhookId[0]}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 200) {
      console.log(
        "Webhook updated successfully",
        response.data,
        ENODE_WEBHOOK_SECRET
      );
      console.log("webhookId", webhookId);
    } else {
      console.error("Unexpected response:", response.status);
      console.log("webhookId", webhookId);
    }
  } catch (error) {
    console.error("Error in updateWebhook", error);
    console.log("webhookId", webhookId);
    listWebHook();
  }
}

async function deleteWebHook(id) {
  try {
    const accessToken = await getAccessToken();

    const response = await axios.delete(
      `${process.env.ENODE_API_URL}/webhooks/${id}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(JSON.stringify(response.data));
    console.log(`webhook ${id} deleted successfully`);
  } catch (error) {
    console.error(error);
  }
}

async function testWebhook(webhookId) {
  try {
    const accessToken = await getAccessToken();

    const response = await axios.post(
      `${process.env.ENODE_API_URL}/webhooks/${webhookId}/test`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
}

module.exports = {
  runWebHook,
  listWebHook,
  updateWebHook,
  testWebhook,
  ENODE_WEBHOOK_SECRET,
  webhookId,
};
