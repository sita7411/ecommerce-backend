const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinaryConfig");
const CategoryBanner = require("../models/CategoryBanner");

const router = express.Router();

// ✅ Cloudinary storage setup
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "category_banners",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const upload = multer({ storage });

router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    const banners = await CategoryBanner.find(query).sort({ createdAt: -1 });
    res.json(banners);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch banners" });
  }
});


router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, category } = req.body;
    if (!req.file) return res.status(400).json({ message: "Image required" });
    if (!category) return res.status(400).json({ message: "Category required" });

    const banner = new CategoryBanner({
      name,
      category,
      imageUrl: req.file.path,
    });

    await banner.save();
    res.status(201).json(banner);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create banner" });
  }
});

// -------------------- UPDATE BANNER --------------------
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const banner = await CategoryBanner.findById(id);
    if (!banner) return res.status(404).json({ message: "Banner not found" });

    if (name) banner.name = name;
    if (req.file) banner.imageUrl = req.file.path;

    await banner.save();
    res.json(banner);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update banner" });
  }
});

// -------------------- DELETE BANNER --------------------
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await CategoryBanner.findByIdAndDelete(id);
    if (!banner) return res.status(404).json({ message: "Banner not found" });

    res.json({ message: "Banner deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete banner" });
  }
});

module.exports = router;
