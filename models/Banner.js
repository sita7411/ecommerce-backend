const mongoose = require("mongoose");

const BannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  desc: { type: String, required: true },
  subtext: { type: String },
  btnText: { type: String },
  btnLink: { type: String },
  imageUrl: { type: String, required: true }, // Cloudinary URL
}, { timestamps: true });

module.exports = mongoose.model("Banner", BannerSchema);
