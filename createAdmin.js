// createAdmin.js
require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("./models/Admin");

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const name = "Super Admin";
    const email = "admin@gmail.com";
    const password = "admin123";

    const existing = await Admin.findOne({ email });
    if (existing) {
      console.log("⚠️ Admin already exists:", existing.email);
      return process.exit();
    }

    // ❌ Don't hash manually, let schema pre('save') handle it
    const newAdmin = new Admin({ name, email, password });
    await newAdmin.save();

    console.log("✅ Admin created successfully!");
    console.log("Email:", email);
    console.log("Password:", password);

    process.exit();
  } catch (err) {
    console.error("❌ Error creating admin:", err.message);
    process.exit(1);
  }
}

createAdmin();
