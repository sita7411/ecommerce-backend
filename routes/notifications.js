const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");

// ----------------- GET ALL NOTIFICATIONS -----------------
router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .lean();
    res.json({ notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// ----------------- CREATE NOTIFICATION -----------------
// ----------------- CREATE NOTIFICATION -----------------
router.post("/", async (req, res) => {
  try {
    const { type, userId, orderId, productId, message } = req.body;

    let name = "";
    let displayMessage = message;

    if (type === "order") {
      const order = await Order.findById(orderId).populate("user");
      const user = order?.user || (userId && (await User.findById(userId)));
      name = user
        ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Customer"
        : "Customer";
      displayMessage = `${name} placed a new order #${order?._id.toString().slice(-6).toUpperCase()}`;
    } else if (type === "inventory") {
      const product = await Product.findById(productId);
      name = product ? product.name : "Product";
      displayMessage = `Product updated: ${product ? product.name : ""}`;
    } else if (type === "user") {
      const user = await User.findById(userId);
      name = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Customer" : "Customer";
      displayMessage = message || `${name} performed an action`;
    }

    // Create notification with proper name and message
    const notification = await Notification.create({
      type,
      userId,
      orderId,
      productId,
      message: displayMessage,
      name,
      read: false,
    });

    // Emit real-time notification
    if (req.io) {
      req.io.emit("newNotification", {
        id: notification._id.toString(),
        type,
        userId,
        orderId,
        productId,
        name,
        message: displayMessage,
        date: notification.createdAt.toISOString(),
        read: false,
      });
    }

    res.status(201).json({ notification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create notification" });
  }
});


// ----------------- DELETE ONE NOTIFICATION -----------------
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Notification.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Notification not found" });
    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete notification" });
  }
});

// ----------------- DELETE ALL NOTIFICATIONS -----------------
router.delete("/", async (req, res) => {
  try {
    await Notification.deleteMany({});
    res.status(200).json({ message: "All notifications deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete notifications" });
  }
});

module.exports = router;
