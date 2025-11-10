const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  bannerTitle: {
    type: String,
    default: "Contact Us",
  },
  bannerSubtitle: {
    type: String,
    default: "We’re here to help — get in touch with our team anytime!",
  },
  phone: {
    type: String,
    default: "+91 99999 99999",
  },
  email: {
    type: String,
    default: "info@support@shopper.com",
  },
  address: {
    type: String,
    default: "Shooper, Ahmedabad, India",
  },
  mapSrc: {
    type: String,
    default: "",
  },
});

module.exports = mongoose.model("Contact", contactSchema);
