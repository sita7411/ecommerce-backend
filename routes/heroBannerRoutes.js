const express = require("express");
const router = express.Router();
const Banner = require("../models/Banner");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinaryConfig");

// Multer + Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "hero-banners",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const upload = multer({ storage });

// GET all banners
router.get("/", async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    res.json(banners);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch banners" });
  }
});

// POST new banner
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { title, desc, subtext, btnText, btnLink } = req.body;
    if (!req.file) return res.status(400).json({ message: "Image is required" });

    const newBanner = new Banner({
      title,
      desc,
      subtext,
      btnText,
      btnLink,
      imageUrl: req.file.path, // Cloudinary URL
    });

    await newBanner.save();
    res.status(201).json(newBanner);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to upload banner" });
  }
});

// PUT update banner
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { title, desc, subtext, btnText, btnLink } = req.body;
    const updateData = { title, desc, subtext, btnText, btnLink };

    if (req.file) {
      updateData.imageUrl = req.file.path;
    }

    const updatedBanner = await Banner.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updatedBanner);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update banner" });
  }
});

// DELETE banner
router.delete("/:id", async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ message: "Banner deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete banner" });
  }
});

module.exports = router;
