  const mongoose = require("mongoose");

  const OfferSchema = new mongoose.Schema({
    title: { type: String, required: true },
    discountPercent: { type: Number, required: true },
    code: { type: String, required: true, unique: true },
    active: { type: Boolean, default: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
  });

  // ✅ Prevent OverwriteModelError
  module.exports = mongoose.models.Offer || mongoose.model("Offer", OfferSchema);
