const Contact = require("../models/Contact");

// 🟢 GET - Fetch Contact Data
const getContact = async (req, res) => {
  try {
    let contact = await Contact.findOne();
    if (!contact) {
      contact = await Contact.create({});
    }
    res.json(contact);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🟠 PUT - Update Contact Data
const updateContact = async (req, res) => {
  try {
    const data = req.body;
    let contact = await Contact.findOne();

    if (!contact) {
      contact = new Contact(data);
    } else {
      Object.assign(contact, data);
    }

    await contact.save();
    res.json({ message: "Contact updated successfully!", contact });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getContact, updateContact };
