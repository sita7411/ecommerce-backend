const express = require("express");
const router = express.Router();
const User = require("../models/User");
const mongoose = require("mongoose"); // <-- Add this

const bcrypt = require("bcryptjs");
const authMiddleware = require("../middleware/authMiddleware");

// ----------------- GET LOGGED-IN USER INFO -----------------
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------- UPDATE PROFILE -----------------
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    // Ensure user can only update their own profile
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).select("-password");

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------- UPDATE PASSWORD -----------------
router.put("/password/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Current password is incorrect" });

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------- CHECK FIRST ORDER DISCOUNT -----------------
router.get("/first-order", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const hasPreviousOrders = user.orders && user.orders.length > 0;

    if (!hasPreviousOrders) {
      return res.json({
        eligible: true,
        discount: 20,
        message: "You are eligible for a 20% first order discount!",
      });
    } else {
      return res.json({
        eligible: false,
        discount: 0,
        message: "First order discount already used.",
      });
    }
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------- MARK ORDER AS COMPLETED -----------------
router.post("/mark-order", authMiddleware, async (req, res) => {
  try {
    const { orderId, total } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.orders = user.orders || [];
    user.orders.push({ orderId, total, createdAt: new Date() });
    await user.save();

    res.json({ message: "Order saved successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET NEW CUSTOMERS COUNT (last 30 days)
router.get("/new-customers", async (req, res) => {
  try {
    // Check connection
    if (mongoose.connection.readyState !== 1) {
      console.error("MongoDB not connected! Ready state:", mongoose.connection.readyState);
      return res.status(500).json({ message: "MongoDB not connected" });
    }

    // 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    console.log("🗓️ Thirty days ago:", thirtyDaysAgo);

    // Fetch new customers safely
    const newCustomers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    console.log("🆕 New customers count:", newCustomers);

    return res.json({ newCustomers });
  } catch (err) {
    console.error("Error in /new-customers:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});


module.exports = router;
