const express = require("express");
const cors = require("cors");
const { connectDB } = require("./src/config/db");
const userRoutes = require("./src/routers/userRoutes");
const productRoutes = require("./src/routers/productRoutes");
const orderRoutes = require("./src/routers/orderRoutes");
const printOrderRoutes = require("./src/routers/printOrderRoutes");
const reviewRoutes = require("./src/routers/reviewRoutes");
const dealerRoutes = require("./src/routers/dealerRoutes");
const invoiceRoutes = require("./src/routers/invoiceRoutes");
const keywordRoutes = require("./src/routers/keywordRoutes");
const wishlistRouter = require("./src/routers/wishlist");
const cartRouter = require("./src/routers/cart");
require("dotenv").config();

const app = express();

// Enable CORS for all origins
app.use(cors());

// Parse JSON — limit raised to 50 mb to handle base64 image uploads from the admin UI
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const path = require('path');
// serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// upload route
const uploadRoutes = require('./src/routers/uploadRoutes');
app.use('/api', uploadRoutes);

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use("/api", userRoutes);
app.use("/api", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/print-orders", printOrderRoutes);
app.use("/api", reviewRoutes);
app.use("/api/dealers", dealerRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/keywords", keywordRoutes);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/cart", cartRouter);

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
  });
});

// Sample Route
app.get("/", (req, res) => {
  res.send("Backend API Running...");
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    const pool = await connectDB();
    app.locals.pool = pool;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start backend:", error);
    process.exit(1);
  }
}

startServer();

module.exports = app;

