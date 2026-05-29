const express = require("express");
const cors = require("cors");
const { connectDB } = require("./src/config/db");
const userRoutes = require("./src/routers/userRoutes");
const productRoutes = require("./src/routers/productRoutes");
require("dotenv").config();

const app = express();

// Enable CORS for all origins
app.use(cors());

// Parse JSON — limit raised to 50 mb to handle base64 image uploads from the admin UI
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use("/api", userRoutes);
app.use("/api", productRoutes);

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

