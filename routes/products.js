// routes/productRoutes.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Product = require("../models/Product");
const Offer = require("../models/Offer");
const adminAuth = require("../middleware/adminAuth"); // ✅ Admin middleware

// Utility: Calculate discount percentage
const calculateDiscount = (oldPrice, newPrice) => {
  if (!oldPrice || oldPrice <= newPrice) return 0;
  return Math.round(((oldPrice - newPrice) / oldPrice) * 100);
};

// Middleware: Validate ObjectId
const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.log(`❌ Invalid ObjectId: ${id}`);
    return res.status(400).json({ message: "Invalid product ID format" });
  }
  next();
};

// Get Active Offer
const getActiveOffer = async () => {
  const now = new Date();
  return await Offer.findOne({
    active: true,
    $or: [{ endDate: { $exists: false } }, { endDate: { $gte: now } }],
  }).sort({ startDate: -1 });
};

/* --------------------- PUBLIC ROUTES --------------------- */

// GET ALL PRODUCTS (customer view)
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    const activeOffer = await getActiveOffer();

    const updatedProducts = products.map((p) => {
      let discounted_price = p.new_price;
      let offerApplied = null;

      if (activeOffer) {
        discounted_price =
          p.new_price - (p.new_price * activeOffer.discountPercent) / 100;
        offerApplied = `${activeOffer.discountPercent}% OFF`;
      }

      return {
        ...p._doc,
        image: p.image || "/images/default.jpg",
        discounted_price: Number(discounted_price.toFixed(2)),
        offerApplied,
      };
    });

    res.json(updatedProducts);
  } catch (err) {
    console.error("❌ Error fetching products:", err);
    res.status(500).json({ message: "Server error while fetching products" });
  }
});

// GET SINGLE PRODUCT (customer view)
router.get("/:id", validateObjectId, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Product not found" });

    const activeOffer = await getActiveOffer();
    let discounted_price = product.new_price;
    let offerApplied = null;

    if (activeOffer) {
      discounted_price =
        product.new_price - (product.new_price * activeOffer.discountPercent) / 100;
      offerApplied = `${activeOffer.discountPercent}% OFF`;
    }

    res.json({
      ...product._doc,
      image: product.image || "/images/default.jpg",
      discounted_price: Number(discounted_price.toFixed(2)),
      offerApplied,
    });
  } catch (err) {
    console.error("❌ Error retrieving product:", err);
    res.status(500).json({ message: "Error retrieving product" });
  }
});

// GET RELATED PRODUCTS
router.get("/related/:id", validateObjectId, async (req, res) => {
  try {
    const currentProduct = await Product.findById(req.params.id);
    if (!currentProduct) return res.status(404).json({ message: "Product not found" });

    let related = await Product.find({
      _id: { $ne: currentProduct._id },
      category: currentProduct.category.trim().toLowerCase(),
    }).limit(4);

    if (related.length === 0) {
      related = await Product.find({ _id: { $ne: currentProduct._id } }).limit(4);
    }

    res.json(related);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching related products" });
  }
});

/* --------------------- ADMIN-ONLY ROUTES --------------------- */

// ADD PRODUCT
router.post("/", adminAuth, async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      old_price,
      new_price,
      inStock,
      stockQuantity,
      sizes,
      colors,
      sku,
      tags,
      images = [],
    } = req.body;

    if (!name || !new_price || !sku)
      return res.status(400).json({ message: "Name, New Price, and SKU are required." });

    const discount = calculateDiscount(old_price, new_price);

    const newProduct = new Product({
      name,
      category,
      description,
      old_price,
      new_price,
      discount,
      inStock,
      stockQuantity,
      sizes,
      colors,
      sku,
      tags,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      images,
      image: images[0] || "/images/default.jpg",
    });

    await newProduct.save();

    // Socket.IO notification (inventory)
    if (req.io && stockQuantity <= 5) {
      req.io.emit("newNotification", {
        type: "inventory",
        id: newProduct._id,
        name: newProduct.name,
        message: `is running low on stock (${newProduct.stockQuantity} left)`,
        date: new Date(),
      });
    }

    res.status(201).json({ message: "Product created successfully", newProduct });
  } catch (err) {
    console.error("❌ Error creating product:", err);
    res.status(400).json({ message: err.message });
  }
});

// UPDATE PRODUCT
router.put("/:id", adminAuth, validateObjectId, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const updateData = { ...req.body };

    if (req.body.old_price || req.body.new_price) {
      updateData.discount = calculateDiscount(
        req.body.old_price || product.old_price,
        req.body.new_price || product.new_price
      );
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (req.io && updated.stockQuantity <= 5) {
      req.io.emit("newNotification", {
        type: "inventory",
        id: updated._id,
        name: updated.name,
        message: `is running low on stock (${updated.stockQuantity} left)`,
        date: new Date(),
      });
    }

    res.json({ message: "Product updated successfully", updated });
  } catch (err) {
    console.error("❌ Error updating product:", err);
    res.status(400).json({ message: err.message });
  }
});

// DELETE PRODUCT
router.delete("/:id", adminAuth, validateObjectId, async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting product:", err);
    res.status(500).json({ message: err.message });
  }
});

// BULK DELETE PRODUCTS
router.post("/bulk-delete", adminAuth, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ message: "Invalid or empty IDs array" });

    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const result = await Product.deleteMany({ _id: { $in: validIds } });

    res.json({ message: "Selected products deleted successfully", deletedCount: result.deletedCount });
  } catch (err) {
    console.error("❌ Error bulk deleting products:", err);
    res.status(500).json({ message: err.message });
  }
});

// TOGGLE POPULAR STATUS
router.put("/:id/popular", adminAuth, validateObjectId, async (req, res) => {
  try {
    const { isPopular } = req.body;
    const updated = await Product.findByIdAndUpdate(req.params.id, { isPopular }, { new: true });
    if (!updated) return res.status(404).json({ message: "Product not found" });
    res.json(updated);
  } catch (err) {
    console.error("❌ Error toggling popular status:", err);
    res.status(500).json({ message: err.message });
  }
});

// TOGGLE NEW STATUS
router.put("/:id/new", adminAuth, validateObjectId, async (req, res) => {
  try {
    const { isNew } = req.body;
    const updated = await Product.findByIdAndUpdate(req.params.id, { isNew }, { new: true });
    if (!updated) return res.status(404).json({ message: "Product not found" });
    res.json(updated);
  } catch (err) {
    console.error("❌ Error toggling new status:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
