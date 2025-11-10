const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["order", "inventory", "user"],
      required: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    name: { type: String }, // <-- ADD THIS
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);
