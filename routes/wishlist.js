// routes/wishlist.js
const express = require("express");
const router = express.Router();
const Wishlist = require("../models/Wishlist");
const authMiddleware = require("../middleware/authMiddleware");

// 🧾 Get Wishlist
router.get("/", authMiddleware, async (req, res) => {
  try {
    const wishlist =
      (await Wishlist.findOne({ user: req.user._id })) ||
      new Wishlist({ user: req.user._id });
    res.json({ wishlist: Object.fromEntries(wishlist.items) });
  } catch (err) {
    console.error("Fetch wishlist error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ➕ Add/Update Item
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { productId, size = null } = req.body;
    console.log("Adding to wishlist:", { productId, size });

    // Validate productId
    if (!productId || typeof productId !== "string" || productId.trim() === "") {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, items: new Map() });
    }

    wishlist.items.set(productId, { productId, size, dateAdded: new Date() });
    await wishlist.save();

    res.json({ wishlist: Object.fromEntries(wishlist.items) });
  } catch (err) {
    console.error("Wishlist add error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ❌ Remove Item
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const productId = req.params.id;
    if (!productId || typeof productId !== "string" || productId.trim() === "") {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist && wishlist.items.has(productId)) {
      wishlist.items.delete(productId);
      await wishlist.save();
    }
    res.json({ wishlist: Object.fromEntries(wishlist ? wishlist.items : {}) });
  } catch (err) {
    console.error("Wishlist remove error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 🔁 Reset Wishlist
router.post("/reset", authMiddleware, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) {
      wishlist.items = new Map();
      await wishlist.save();
    }
    res.json({ wishlist: {} });
  } catch (err) {
    console.error("Wishlist reset error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;