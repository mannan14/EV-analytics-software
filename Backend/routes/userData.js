const express = require("express");
const router = express.Router();

const {
  getTemperature,
  getParticularVehicle,
  deleteUserImage,
  getImageSignedUplaodURL,
  getSignedImageURL,
} = require("../controllers/userDataController");

const { authenticateToken } = require("../middleware/authenticateToken");

/*PROTECTED ROUTES */
/* Fetching the image's signed URL for a userID
  @params 
    imageName: name of the image (it's the users userId)
  @returns: signed URL for the image
  @throws: error in fetching the signed URL for the image
  @example: 
    const imageName = "image.jpg";
    const type = "image/jpeg";
    const url = await getImageUrl(imageName, type);
    console.log("getImageUrl", url); // Output: "https://example.com/image.jpg"
    // Use the URL in an <img> tag or a <source> tag to load the image
    // from the URL in the browser.
    // <img src={url} />
*/
router.get("/users/image/:imageName", authenticateToken, getSignedImageURL);

/*
  @body:
    imageName: image name (userId of the user)
    type: image type 
  @returns: signed URL for the uploading the image to S3 bucket. 
*/
router.post("/users/image", authenticateToken, getImageSignedUplaodURL);

/* 
  @params: 
    imageName: image name (userId of the user)
  @returns: void
  responds with 204 if image deleted.
*/
router.delete("/users/image/:imageName", authenticateToken, deleteUserImage);

/* 
  fetch required user's particular vehicle according to userId and vehicleId
  @params: 
    userId: user's userId
    vehicleId: user's vehicle vehicleId
*/
router.get("/users/:userId/:vehicleId", authenticateToken, getParticularVehicle);

/* 
  fetch min and max temperature of the userLocation Passed
  @body: 
    userLocation: city, state, country
*/
router.post("/get-temperature", authenticateToken, getTemperature);

module.exports = router;
