const { getAccessToken } = require("../utils/accessToken");
const request = require("request");

const getToken = async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    // if(!accessToken){
    // const accessToken=await getAccessTokenFromEnode()
    // }
    res.status(200).json({ Access_Token: accessToken });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Failed to get access token" });
  }
};

const addVehicleToEnode = async (req, res) => {
  try {
    let accessToken = await getAccessToken();
    let userId = req.params.userId;
    let pageName = req.params.pageName;
    let pageId = req.params.pageId;
    // const redirectPage = req.headers['redirectPage']
    let redirectPage;
    if (pageName === "redirect" && pageId === "dashboard") {
      redirectPage = "";
    } else {
      redirectPage = pageName + "/" + pageId;
    }

    var options = {
      method: "POST",
      url: `${process.env.ENODE_API_URL}/users/${userId}/link`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        vendorType: "vehicle",
        forceLanguage: "en",

        // To check if the scopes are working in the link
        scopes: [
          "vehicle:information",
          "vehicle:charge_state",
          "vehicle:odometer",
        ],
        redirectUri: `http://localhost:3000/dashboard/${redirectPage}`,
      }),
    };

    request(options, (error, response, body) => {
      if (error) {
        console.error("Request error:", error);
        res.status(500).json({ error: "Request error" });
        return;
      }

      try {
        const linkData = JSON.parse(body);
        res.status(200).send(linkData);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        res.status(500).json({ error: "JSON parse error" });
      }
    });
  } catch (error) {
    console.error("Internal server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getUserVehicles = async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    const userId = req.headers["user-id"];
    console.log("userid ->", userId);

    var options = {
      method: "GET",
      url: `${process.env.ENODE_API_URL}/users/${userId}/vehicles`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // 'Enode-User-Id': `${userId}`,
      },
    };

    request(options, function (error, response) {
      if (error) {
        throw new Error(error);
      } else {
        const features_data = JSON.parse(response.body);
        console.log("features_data", features_data);
        res.status(200).send(features_data);
      }
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const getVehicleData = async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    // const userId = req.headers['user-id'];
    const vehicleId = req.params.vid;

    var options = {
      method: "GET",
      url: `${process.env.ENODE_API_URL}/vehicles/${vehicleId}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // 'Enode-User-Id': `${userId}`,
      },
    };

    request(options, async function (error, response) {
      if (error) {
        // if(error.message === 'Unauthorized for resource'){
        //   const newAccessToken = await refreshAccessToken()
        //   accessToken = newAccessToken
        //   updateWebHook()
        //   console.log('access_token refreshed by the get vehicle component')
        // }
        // else
        console.log("error", error.message);
        throw new Error(error);
      } else {
        const vehicle_data = JSON.parse(response.body);
        console.log("vehicle_data", vehicle_data);
        res.status(200).send(vehicle_data);
      }
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const deleteVendor = async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    const userId = req.params.userId;
    const vendorName = req.params.vendorName;

    var options = {
      method: "DELETE",
      url: `${process.env.ENODE_API_URL}/users/${userId}/vendors/${vendorName}/vehicle`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    request(options, function (error, response) {
      if (error) {
        throw new Error(error);
      } else {
        res.status(204).send("Vehicle Deleted");
      }
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const deleteUser = async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    const userId = req.params.userId;

    var options = {
      method: "DELETE",
      url: `${process.env.ENODE_API_URL}/users/${userId}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };
    request(options, function (error, response) {
      if (error) throw new Error(error);
      else {
        // if (response.status === 204)
        console.log("User deleted from enode.");
        res.status(204).send("User deleted successfully");
        // else console.log("Could not delete user from enode: ", response.status);
      }
    });
  } catch (err) {
    res.status(404).json({ error: err });
    console.log(err, " Error deleting user from enode.");
  }
};

const getIntervention = async (req, res) => {
  try {
    const interventionId = req.params.interventionId;
    const accessToken = await getAccessToken();
  } catch (err) {
    res.status(500).json({ error: err });
    console.log(err, " Error getting vehicle intervention information.");
  }
};

module.exports = {
  getToken,
  addVehicleToEnode,
  getUserVehicles,
  getVehicleData,
  deleteVendor,
  deleteUser,
  getIntervention,
};
