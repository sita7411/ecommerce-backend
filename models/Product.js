const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
   category: { 
      type: String, 
      default: "General",
      trim: true,
      lowercase: true
    },    description: { type: String, default: "" },

    image: { type: String, default: "" },
    images: { type: [String], default: [] },

    old_price: { type: Number, default: 0 },
    new_price: { type: Number, required: true },
    discount: { type: Number, default: 0 },

    inStock: { type: Boolean, default: true },
    stockQuantity: { type: Number, default: 0 },

    sizes: { type: [String], default: [] },
    colors: { type: [String], default: [] },
    sku: { type: String, unique: true, required: true },
    tags: { type: [String], default: [] },
    slug: { type: String, lowercase: true, trim: true },

    // Visibility Controls
    isPopular: { type: Boolean, default: false },
    isNew: { type: Boolean, default: false }, // Added for new products
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
