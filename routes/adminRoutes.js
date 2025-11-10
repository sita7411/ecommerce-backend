const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

/* --------------------------------------------
 🟢 Register Admin
--------------------------------------------- */
router.post("/register", async (req, res) => {
  try {
    console.log("🟢 Register request received:", req.body);
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin)
      return res.status(400).json({ message: "Admin already exists" });

    // Create new admin
    const newAdmin = new Admin({ name, email, password });
    await newAdmin.save();

    res.status(201).json({ message: "Admin registered successfully" });
  } catch (err) {
    console.error("❌ Register Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* --------------------------------------------
 🟢 Login Admin
--------------------------------------------- */
router.post("/login", async (req, res) => {
  try {
    console.log("🟢 Login request received:", req.body);

    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "All fields are required" });

    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin)
      return res.status(400).json({ message: "Invalid credentials" });

    // Compare password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // Generate JWT
    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
  { expiresIn: "7d" } // 7 days
    );

    // Send response
    res.status(200).json({
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        avatar: admin.avatar || "",
        phone: admin.phone || "",
        role: admin.role || "Admin",
      },
    });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* --------------------------------------------
 🟢 Update Admin Profile (Protected)
--------------------------------------------- */
router.put("/update", adminAuth, async (req, res) => {
  try {
    const { name, phone, avatar, role } = req.body;

    const updatedAdmin = await Admin.findByIdAndUpdate(
      req.admin._id,
      { name, phone, avatar, role },
      { new: true }
    ).select("-password");

    if (!updatedAdmin)
      return res.status(404).json({ message: "Admin not found" });

    res.json({
      success: true,
      message: "Profile updated successfully",
      admin: updatedAdmin,
    });
  } catch (error) {
    console.error("❌ Update Profile Error:", error);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
});

/* --------------------------------------------
 🟢 Get Logged-in Admin Details (Protected)
--------------------------------------------- */
router.get("/me", adminAuth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select("-password");
    if (!admin)
      return res.status(404).json({ message: "Admin not found" });

    res.json({ success: true, admin });
  } catch (error) {
    console.error("❌ Fetch Admin Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch admin data" });
  }
});

module.exports = router;
