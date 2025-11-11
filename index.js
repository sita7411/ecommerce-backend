// -------------------- IMPORTS --------------------
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require("helmet");
const http = require("http");
const { Server } = require("socket.io");

// -------------------- APP INITIALIZATION --------------------
const app = express();
const port = process.env.PORT || 4000;

// -------------------- MIDDLEWARE --------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// -------------------- CORS CONFIGURATION --------------------
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://ecommerce-frontend-ochre-eight-96.vercel.app",
  "https://ecommerce-admin-neon-one.vercel.app",
];

// Dynamic origin function
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, CURL)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// -------------------- MONGODB CONNECTION --------------------
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected successfully!"))
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));

// -------------------- SOCKET.IO --------------------
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🔌 A user connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// Make io available in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// -------------------- ROUTES --------------------
app.use("/api/auth", require("./routes/auth"));
app.use("/api/upload", require("./routes/uploadRoute"));
app.use("/api/products", require("./routes/products"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/wishlist", require("./routes/wishlist"));
app.use("/api/orders", require("./routes/order"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/offer", require("./routes/offerRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/logo", require("./routes/logoRoute"));
app.use("/api/category-banners", require("./routes/categoryBannerRoutes"));
app.use("/api/hero-banners", require("./routes/heroBannerRoutes"));
app.use("/api/users", require("./routes/customers"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/returns", require("./routes/returnRoutes"));
app.use("/api/contact", require("./routes/contactRoutes"));

// -------------------- ROOT ROUTE --------------------
app.get("/", (req, res) => {
  res.json({ message: "🚀 Server running successfully!" });
});

// -------------------- START SERVER --------------------
server.listen(port, () =>
  console.log(`🚀 Server running on http://localhost:${port}`)
);
