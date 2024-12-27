const express = require("express");
const {
  createSubscription,
  getSubscriptionsByUser,
  updateSubscription,
  deleteSubscription,
} = require("../controllers/subscriptionController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Create a subscription
router.post("/", authMiddleware, createSubscription);

// Get subscriptions for a user
router.get("/", authMiddleware, getSubscriptionsByUser);

// Update a subscription
router.put("/:id", authMiddleware, updateSubscription);

// Delete a subscription
router.delete("/:id", authMiddleware, deleteSubscription);

module.exports = router;
