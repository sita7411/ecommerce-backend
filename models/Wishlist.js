// models/Wishlist.js
const mongoose = require("mongoose");

const WishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: {
    type: Map,
    of: new mongoose.Schema({
      productId: { type: String, required: true }, // Added for clarity
      size: { type: String, default: null },
      dateAdded: { type: Date, default: Date.now },
    }, { _id: false }),
    default: {},
  },
});

module.exports = mongoose.model("Wishlist", WishlistSchema);