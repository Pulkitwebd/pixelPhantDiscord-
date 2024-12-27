const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Subscription = require("../models/Subscription");

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// Register a user
exports.registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  console.log("hello........................................................................")
  console.log(username, email, password)

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ username, email, password });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Login a user
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.status(200).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    // Find the user and exclude the password field
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch subscriptions associated with the user
    const subscriptions = await Subscription.find({ userID: userId });

    // Combine the user data and subscriptions into a response object
    const userProfile = {
      username: user.username,
      email: user.email,
      services: subscriptions, // Attach subscriptions here
    };

    // Send the response with user details and subscriptions
    res.status(200).json(userProfile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


