// seedOffers.js
const mongoose = require("mongoose");
require("dotenv").config();
const Offer = require("./models/Offer");

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // remove existing offers (optional)
    // await Offer.deleteMany({});

    // create a FIRST20 offer if not existing
    const exists = await Offer.findOne({ code: "FIRST20" });
    if (!exists) {
      await Offer.create({
        title: "Welcome Offer - First Order 20% OFF",
        code: "FIRST20",
        discountPercent: 20,
        active: true,
        startDate: new Date(),
        endDate: new Date("2099-12-31"),
      });
      console.log("Inserted FIRST20 offer");
    } else {
      console.log("FIRST20 already exists");
    }

    mongoose.connection.close();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
