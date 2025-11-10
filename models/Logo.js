// backend/models/Logo.js
const mongoose = require("mongoose");

const logoSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "default_logo",
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true } // createdAt & updatedAt automatically
);

module.exports = mongoose.model("Logo", logoSchema);
