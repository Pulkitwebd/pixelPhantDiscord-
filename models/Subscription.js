const mongoose = require("mongoose");

const subscriptionSchema = mongoose.Schema(
  {
    serviceID: {
      type: String,
      required: true,
    },
    serviceName: {
      type: String,
      required: true,
    },
    serviceLink: {
      type: String,
      required: true,
    },
    monthlyFee: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    userID: {
      type: mongoose.Schema.Types.ObjectId,  // This ensures the field is a valid ObjectId reference
      ref: "User",  // Reference to the User model
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
