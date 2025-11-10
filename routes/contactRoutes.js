const express = require("express");
const router = express.Router();
const { getContact, updateContact } = require("../controllers/contactController");

// Routes
router.get("/", getContact);
router.put("/", updateContact);

module.exports = router;
