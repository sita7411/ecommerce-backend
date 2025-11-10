const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");

// 🛒 GET CART
router.get("/", authMiddleware, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });

    // If cart doesn't exist, create an empty one
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: new Map() });
      await cart.save();
    }

    // Convert Map safely
    const cartObject = cart.items instanceof Map ? Object.fromEntries(cart.items) : {};

    return res.json({ cart: cartObject });
  } catch (err) {
    console.error("❌ Error fetching cart:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ➕ ADD ITEM TO CART
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { productId, qty = 1, size = null } = req.body;

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = new Cart({ user: req.user._id, items: new Map() });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const finalPrice = product.discounted_price || product.new_price;

    // Existing item?
    const currentItem = cart.items.get(productId);
    if (currentItem) {
      currentItem.qty += qty;
      cart.items.set(productId, currentItem);
    } else {
      cart.items.set(productId, {
        qty,
        size,
        price: finalPrice,
        name: product.name,
        image: product.images?.[0] || product.image || null,
      });
    }

    await cart.save();
    return res.json({ cart: Object.fromEntries(cart.items) });
  } catch (err) {
    console.error("❌ Error adding to cart:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔄 UPDATE QTY
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { qty } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });

    if (cart && cart.items.has(req.params.id)) {
      const item = cart.items.get(req.params.id);
      item.qty = qty;
      cart.items.set(req.params.id, item);
      await cart.save();
    }

    return res.json({ cart: Object.fromEntries(cart ? cart.items : []) });
  } catch (err) {
    console.error("❌ Error updating cart:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ❌ DELETE ITEM
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items.delete(req.params.id);
    await cart.save();

    return res.json({ cart: Object.fromEntries(cart.items) });
  } catch (err) {
    console.error("❌ Error deleting cart item:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🧹 RESET CART
router.post("/reset", authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = new Map();
      await cart.save();
    }

    return res.json({ cart: {} });
  } catch (err) {
    console.error("❌ Error resetting cart:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
