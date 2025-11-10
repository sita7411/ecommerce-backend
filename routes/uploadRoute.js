// backend/routes/uploadRoute.js
const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinaryConfig");

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const upload = multer({ storage });

// ✅ Multiple image upload (no `/upload` prefix here)
router.post("/", upload.array("images", 5), (req, res) => {
  try {
    const urls = req.files.map((file) => file.path);
    res.json({ success: true, urls });
  } catch (error) {
    console.error("❌ Upload failed:", error);
    res.status(500).json({ success: false, message: "Image upload failed" });
  }
});

module.exports = router;
