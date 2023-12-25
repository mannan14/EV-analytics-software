const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middleware/authenticateToken");
const {
  createCheckoutSession,
  getSessionDetails,
  listLineItems,
  getCustomerDetails,
  getPaymentAndSubscriptionStatus,
  deleteCustomerFromStripe,
  createCustomerPortal
} = require("../controllers/subscriptionController");

//PUBLIC ROUTES
// creates checkout session for payments.
router.post("/create-checkout-session", createCheckoutSession);

// gets checkout session details using sessionId
router.get("/checkout", getSessionDetails);

// list items purchase or subscribed to.
router.get("/listLineItems", listLineItems);

// pass customer email in query and get the paymentStatus and subscription status.
// router.get("/get-payment-subscription-status", authenticateToken, getPaymentAndSubscriptionStatus);
router.get("/get-payment-subscription-status", getPaymentAndSubscriptionStatus);


// PROTECTED ROUTES //
//create a customer portal for a particular user.
router.post("/create-customer-portal-session", authenticateToken, createCustomerPortal);

// routes for DB operations
// pass customer email in query and get all details of customer related to subscription.
router.get("/get-customer-details", authenticateToken, getCustomerDetails);

// detlete customer(deleting customer delete it's subscription as well)
// use this when user deletes it's account from the dashboard.
router.delete("/delete-customer", authenticateToken, deleteCustomerFromStripe);

module.exports = router;
