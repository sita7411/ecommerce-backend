const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const adminAuth = require("../middleware/adminAuth");
const Order = require("../models/Order");

// POST /api/returns
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { orderId, reason } = req.body;

    if (!reason)
      return res.status(400).json({ message: "Please provide a reason for return" });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.isReturnRequested)
      return res.status(400).json({ message: "Return already requested" });
    if (order.status !== "Delivered")
      return res.status(400).json({ message: "Order not delivered yet" });

    order.isReturnRequested = true;
    order.returnReason = reason;
    order.status = "Return Requested"; // optional
    await order.save();

    res.json({ message: "Return request submitted successfully!", order });
  } catch (err) {
    console.error("Return error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/returns - all return requests (admin)
router.get("/", adminAuth, async (req, res) => {
  try {
    const returns = await Order.find({ isReturnRequested: true })
      .sort({ updatedAt: -1 })
      .populate("user", "firstName lastName email"); // ✅ populate correct fields

    res.json({ returns });
  } catch (err) {
    console.error("Error fetching return orders:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
