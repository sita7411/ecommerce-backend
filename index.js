// -------------------- IMPORTS --------------------
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require("helmet");
const ExcelJS = require("exceljs"); // small letters 'exceljs'
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

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://ecommerce-frontend-ochre-eight-96.vercel.app", // Vercel frontend
  "https://ecommerce-admin-neon-one.vercel.app" // ✅ Add this
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// -------------------- MONGODB CONNECTION --------------------
const mongoURI = process.env.MONGO_URI;
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected successfully!"))
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));

// -------------------- SOCKET.IO --------------------
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🔌 A user connected:", socket.id);

  // Example: admin-only room
  if (socket.user?.role === "admin") {
    socket.join("admins");
  }

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// Make io available in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// -------------------- ROUTE IMPORTS --------------------
const authRoutes = require("./routes/auth");
const uploadRoute = require("./routes/uploadRoute"); 
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const wishlistRoutes = require("./routes/wishlist");
const orderRoutes = require("./routes/order");
const logoRoute = require("./routes/logoRoute");
const heroBannerRoutes = require("./routes/heroBannerRoutes");
const categoryBannerRoutes = require("./routes/categoryBannerRoutes");
const userRoutes = require("./routes/userRoutes");
const offerRoutes = require("./routes/offerRoutes");
const adminRoutes = require("./routes/adminRoutes");
const customerRoutes = require("./routes/customers");
const notificationRoutes = require("./routes/notifications");
const returnRoutes = require("./routes/returnRoutes");
const contactRoutes = require("./routes/contactRoutes");

// -------------------- API ROUTES --------------------
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoute);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/user", userRoutes);
app.use("/api/offer", offerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/logo", logoRoute);
app.use("/api/category-banners", categoryBannerRoutes);
app.use("/api/hero-banners", heroBannerRoutes);
app.use("/api/users", customerRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/contact", contactRoutes);

// -------------------- ROOT ROUTE --------------------
app.get("/", (req, res) => {
  res.json({ message: "🚀 Server running successfully!" });
});

// -------------------- START SERVER --------------------
server.listen(port, () =>
  console.log(`🚀 Server running on http://localhost:${port}`)
);
