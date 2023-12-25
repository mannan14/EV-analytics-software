const express = require("express");
const router = express.Router();

const {
  signup,
  getAllUsers,
  getUserData,
  deleteUserDataFromDB,
  updateUserData,
  isValidEmail
} = require("../controllers/userAuthController");

const { authenticateToken } = require("../middleware/authenticateToken");

/* PUBLIC ROUTES */
// store user data in DB while signup
router.post("/signup", signup);

// fetch all the users
router.get("/users", getAllUsers);

// check user email present in subscription Table
router.post("/is-valid-email", isValidEmail);


/*PROTECTED ROUTES */
// fetch user data by userId on login
router.get("/users/:userId", authenticateToken, getUserData);

// delete complete user data from dynamoDB
router.get("/users/delete/:userId", authenticateToken, deleteUserDataFromDB);

// patch to update user's info
router.patch("/users/:userId", authenticateToken, updateUserData);

module.exports = router;
