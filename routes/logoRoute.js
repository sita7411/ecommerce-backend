// backend/routes/logoRoute.js
const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinaryConfig");
const Logo = require("../models/Logo");

const router = express.Router();

// ✅ Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "logos",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "svg"],
  },
});

const upload = multer({ storage });

// POST /api/logo -> Upload & save
router.post("/", upload.single("logo"), async (req, res) => {
  try {
    const url = req.file.path;

    // Optional: replace previous logo
    let logo = await Logo.findOne({ name: "default_logo" });
    if (logo) {
      logo.url = url;
      await logo.save();
    } else {
      logo = await Logo.create({ name: "default_logo", url });
    }

    res.json({ success: true, logo });
  } catch (error) {
    console.error("❌ Logo upload failed:", error);
    res.status(500).json({ success: false, message: "Logo upload failed" });
  }
});

// GET /api/logo -> Get current logo
router.get("/", async (req, res) => {
  try {
    const logo = await Logo.findOne({ name: "default_logo" });
    res.json({ success: true, logo });
  } catch (error) {
    console.error("❌ Fetch logo failed:", error);
    res.status(500).json({ success: false, message: "Fetching logo failed" });
  }
});

module.exports = router;
