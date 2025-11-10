const express = require("express");
const router = express.Router();
const User = require("../models/User");

// -------------- GET ALL CUSTOMERS --------------
router.get("/all", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// -------------- GET SINGLE CUSTOMER --------------
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Customer not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// -------------- UPDATE CUSTOMER --------------
router.put("/:id", async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedUser)
      return res.status(404).json({ message: "Customer not found" });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// -------------- DELETE CUSTOMER --------------
router.delete("/:id", async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser)
      return res.status(404).json({ message: "Customer not found" });
    res.json({ message: "Customer deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// -------------- IMPORT CUSTOMERS (EXCEL/CSV) --------------
const multer = require("multer");
const ExcelJS = require("exceljs");

// configure multer
const upload = multer({ storage: multer.memoryStorage() });

router.post("/import", upload.single("file"), async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.worksheets[0];
    const rows = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header
      rows.push({
        firstName: row.getCell(2).value || "",
        lastName: row.getCell(2).value?.split(" ")[1] || "",
        email: row.getCell(3).value || "",
        phone: row.getCell(4).value || "",
      });
    });

    const inserted = await User.insertMany(rows);
    res.json({ message: `${inserted.length} customers imported successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to import customers" });
  }
});

module.exports = router;
