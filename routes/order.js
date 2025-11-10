// routes/orderRoutes.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const authMiddleware = require("../middleware/authMiddleware");
const adminAuth = require("../middleware/adminAuth");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const User = require("../models/User");

const Notification = require("../models/Notification");

// ----------------- CREATE ORDER -----------------
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("Creating order for user:", userId);

    // Fetch user's cart
    const cart = await Cart.findOne({ user: userId });

    // === Build items array from req.body.items OR cart ===
    let itemsArray = [];

    if (
      req.body.items &&
      Array.isArray(req.body.items) &&
      req.body.items.length > 0
    ) {
      itemsArray = req.body.items
        .filter(
          (item) =>
            item.productId &&
            mongoose.Types.ObjectId.isValid(item.productId) &&
            Number.isFinite(item.price) &&
            Number.isFinite(item.qty) &&
            item.price > 0 &&
            item.qty > 0 &&
            item.name
        )
        .map((item) => ({
          productId: new mongoose.mongo.ObjectId(item.productId),
          qty: Number(item.qty),
          size: item.size || "",
          price: Number(item.price),
          name: item.name,
          image: item.image || "",
        }));
    } else if (cart && cart.items && Object.keys(cart.items).length > 0) {
      for (const productId of Object.keys(cart.items)) {
        const details = cart.items[productId];
        if (
          productId &&
          mongoose.Types.ObjectId.isValid(productId) &&
          details &&
          Number.isFinite(details.price) &&
          Number.isFinite(details.qty) &&
          details.price > 0 &&
          details.qty > 0 &&
          details.name
        ) {
          itemsArray.push({
            productId: new mongoose.mongo.ObjectId(productId),
            qty: Number(details.qty),
            size: details.size || "",
            price: Number(details.price),
            name: details.name,
            image: details.image || "",
          });
        }
      }
    }

    if (itemsArray.length === 0) {
      return res.status(400).json({ message: "No valid items to process" });
    }

    // ✅ Calculate total amount
    let totalAmount =
      req.body.totalAmount &&
      Number.isFinite(req.body.totalAmount) &&
      req.body.totalAmount > 0
        ? Number(req.body.totalAmount)
        : itemsArray.reduce((sum, item) => sum + item.price * item.qty, 0);

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({ message: "Invalid total amount" });
    }

    // ✅ Validate address and payment method
    const { shippingAddress, paymentMethod } = req.body;
    if (!shippingAddress || !["COD", "ONLINE", "UPI"].includes(paymentMethod)) {
      return res
        .status(400)
        .json({ message: "Invalid shipping address or payment method" });
    }

    // === OFFER LOGIC: Apply 20% discount on first order ===
    let discount = 0;
    let offerCode = null;
    let offerTitle = null;

    const previousOrderCount = await Order.countDocuments({ user: userId });
    const isFirstOrder = previousOrderCount === 0;

    if (isFirstOrder) {
      discount = (totalAmount * 20) / 100;
      offerCode = "FIRST20";
      offerTitle = "🎉 First Order - 20% OFF";
      totalAmount -= discount;
    }

    // === Create & Save Order ===
    const order = new Order({
      user: new mongoose.mongo.ObjectId(userId),
      items: itemsArray,
      shippingAddress,
      paymentMethod,
      shippingPrice: req.body.shippingPrice || 0,
      taxPrice: req.body.taxPrice || 0,
      discount,
      offerCode,
      offerTitle,
      totalAmount,
      status: "Delivered",
    });

    await order.save();

    // Clear cart safely
    if (cart) {
      cart.items = {};
      await cart.save();
    }

    // ⚡ Notify admin of new order (admin-only)

if (req.io) {
  // Fetch the user
  const user = await User.findById(userId);

  // Build full name fallback logic
  const userName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.name || user.email || "Customer"
    : "Customer";

  const orderIdShort = order._id.toString().slice(-6).toUpperCase();

  // Save notification with 'name'
  const notification = await Notification.create({
    type: "order",
    userId,
    orderId: order._id,
    name: userName, // ✅ ensures frontend can show name
    message: `${userName} placed a new order #${orderIdShort}`,
    read: false,
  });

  // Emit real-time notification
  req.io.to("admins").emit("newNotification", {
    id: notification._id.toString(),
    type: notification.type,
    userId: notification.userId,
    orderId: notification.orderId,
    name: userName, // ✅ send name to frontend
    message: `${userName} placed a new order #${orderIdShort}`,
    date: notification.createdAt.toISOString(),
    read: notification.read,
  });
}

    return res.status(201).json({
      message:
        isFirstOrder && discount > 0
          ? `🎉 ${
              offerTitle || offerCode
            } applied! You saved ₹${discount.toFixed(2)}`
          : "Order placed successfully",
      order,
    });
  } catch (err) {
    console.error("❌ Order creation error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
});

// ----------------- USER ORDERS -----------------
router.get("/my-orders", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
.populate("user", "firstName lastName email")
      .sort({ createdAt: -1 });
    res.status(200).json({ orders });
  } catch (err) {
    console.error("❌ Fetch user orders error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ----------------- ADMIN: GET ALL ORDERS -----------------
router.get("/", adminAuth, async (req, res) => {
  try {
    const orders = await Order.find({})
  .populate("user", "firstName lastName email") // ✅ now includes firstName & lastName
      .sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found" });
    }

    res.status(200).json({ orders });
  } catch (error) {
    console.error("❌ Error fetching all orders:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
