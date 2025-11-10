const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String },
    total: { type: Number },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false } // optional: prevents automatic _id for each subdocument
);

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    googleId: { type: String },
    phone: { type: String },
    gender: { type: String },
    dob: { type: Date },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    zip: { type: String },
    occupation: { type: String },
    company: { type: String },
    bio: { type: String },
    orders: [orderSchema], // ✅ now properly defined
    isFirstOrder: { type: Boolean, default: true },
    offerClaimed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
