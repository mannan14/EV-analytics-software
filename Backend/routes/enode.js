const express = require("express");
const router = express.Router();

const {
  getToken,
  addVehicleToEnode,
  getUserVehicles,
  getVehicleData,
  deleteVendor,
  deleteUser,
  getIntervention,
} = require("../controllers/enodeController");

const { authenticateToken } = require("../middleware/authenticateToken");

/* PUBLIC ROUTES */
// get access token
router.get("/token", getToken);

/*PROTECTED ROUTES */
// add vehicles to Enode Org
router.get("/users/:userId/link/:pageName/:pageId", authenticateToken, addVehicleToEnode);

// get vehicles data linked to a user
router.get("/get-vehicles", authenticateToken, getUserVehicles);

// @params vid : vehicle id
router.get("/get-vehicles/:vid", authenticateToken, getVehicleData);

//delete entire vendo(ex aidi, ford etc) from endoe
router.get("/delete-entire-vendor/:userId/:vendorName", authenticateToken, deleteVendor);

//delete user from enode
router.get("/delete-user/:userId", authenticateToken, deleteUser);

//get intervention information from enode
router.get("/users/intevention/:interventionId", authenticateToken, getIntervention);

module.exports = router;
