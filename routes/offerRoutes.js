const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Offer = require("../models/Offer");
const Order = require("../models/Order");

// 🎁 Claim Offer (First order only)
router.post("/claim", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // 🔍 Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found. Please register first." });
    }

    // 🧾 Check if user already placed any order
    const hasOrder = await Order.exists({ userId: user._id });
    if (hasOrder) {
      return res.status(400).json({ message: "Offer only valid on your first order!" });
    }

    // 💾 Ensure offer exists
    let offer = await Offer.findOne({ code: "FIRST20" });
    if (!offer) {
      offer = await Offer.create({
        title: "First Order 20% OFF",
        discountPercent: 20,
        code: "FIRST20",
        active: true,
      });
    }

    // 🧠 Mark user has claimed offer
    user.offerClaimed = true;
    await user.save();

    return res.json({
      success: true,
      message: "🎉 20% OFF applied successfully! Use on your first order.",
      offer: {
        code: offer.code,
        discount: offer.discountPercent,
      },
    });
  } catch (err) {
    console.error("Error claiming offer:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
