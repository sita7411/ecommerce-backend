// models/Cart.js
const mongoose = require("mongoose");

const CartItemSchema = new mongoose.Schema({
  qty: { type: Number, default: 1 },
  size: { type: String, default: null },
  price: { type: Number, required: true },
  name: { type: String, required: true },
  image: { type: String, default: null },
}, { _id: false });

const CartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: {
    type: Map,
    of: CartItemSchema,
    default: {}, // Ensures items always exists
  },
});

module.exports = mongoose.model("Cart", CartSchema);