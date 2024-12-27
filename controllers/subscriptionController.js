const Subscription = require("../models/Subscription");
const User = require("../models/userModel");

// Create a new subscription
exports.createSubscription = async (req, res) => {
  const { serviceID, serviceName, serviceLink, monthlyFee, startDate } =
    req.body;

  console.log(serviceID, serviceName, serviceLink, monthlyFee, startDate);

  try {
    // Ensure the userID is passed as an ObjectId
    const userId = req.user.id;
    console.log("userId", userId);
    const user = await User.findById(userId);

    console.log(user);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const subscription = await Subscription.create({
      serviceID,
      serviceName,
      serviceLink,
      monthlyFee,
      startDate,
      userID: user._id, // Ensure ObjectId reference is used here
    });

    if (subscription) {
      res.status(201).json({
        message: "Subscription created successfully",
        subscription,
      });
    } else {
      res.status(400).json({ message: "Failed to create subscription" });
    }
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get all subscriptions for a user
exports.getSubscriptionsByUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const subscriptions = await Subscription.find({ userID: userId });
    res.status(200).json({ subscriptions });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch subscriptions", error: error.message });
  }
};


// Update a subscription
exports.updateSubscription = async (req, res) => {
  try {
    console.log("before user id")
    const userId = req.user.id;
    console.log("after user id")
    const updatedData = req.body;

    console.log("hello..........")
    const subscriptionId = req.params.id; // Subscription ID passed in the URL


    console.log(userId, updatedData, subscriptionId)

    // Find the subscription by ID and ensure the user is the owner
    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      userID: userId,
    });

    console.log("subscription", subscription)

    // Check if the subscription exists and belongs to the user
    if (!subscription) {
      return res.status(404).json({
        message:
          "Subscription not found or you are not authorized to update it",
      });
    }

    // Update the subscription with new data
    const updatedSubscription = await Subscription.findByIdAndUpdate(
      subscriptionId,
      updatedData,
      { new: true }
    );

    res.status(200).json({
      message: "Subscription updated successfully",
      subscription: updatedSubscription,
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({
      message: "Failed to update subscription",
      error: error.message,
    });
  }
};

// Delete a subscription
exports.deleteSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const subscriptionId = req.params.id; // Subscription ID passed in the URL

    // Find the subscription by ID and ensure the user is the owner
    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      userID: userId,
    });

    // Check if the subscription exists and belongs to the user
    if (!subscription) {
      return res
        .status(404)
        .json({
          message:
            "Subscription not found or you are not authorized to delete it",
        });
    }

    // Delete the subscription
    await Subscription.findByIdAndDelete(subscriptionId);

    res.status(200).json({
      message: "Subscription deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting subscription:", error);
    res.status(500).json({
      message: "Failed to delete subscription",
      error: error.message,
    });
  }
};
