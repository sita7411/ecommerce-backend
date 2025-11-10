const mongoose = require("mongoose");

const categoryBannerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true, // "mens", "womens", "kids"
      enum: ["mens", "womens", "kids"], // optional but recommended
    },
    imageUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CategoryBanner", categoryBannerSchema);
