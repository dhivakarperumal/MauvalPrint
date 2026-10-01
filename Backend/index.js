const express = require("express");
const cors = require("cors");
const { connectDB } = require("./src/config/db");
const { createSocketServer } = require("./src/realtime/socketServer");
const { createMutationEventMiddleware } = require("./src/realtime/mutationEvents");
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

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

<<<<<<< Updated upstream
app.use("/api", userRoutes);
app.use("/api", productRoutes);
=======
// Log incoming order request sizes for debugging large payloads
app.use('/api/orders', (req, res, next) => {
  try {
    const len = req.headers['content-length'] || '(unknown)';
    console.log(`[${new Date().toISOString()}] /api/orders ${req.method} content-length=${len}`);
  } catch (e) {
    console.error('Error logging /api/orders request size', e);
  }
  next();
});

app.use("/api", createMutationEventMiddleware(app));

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
>>>>>>> Stashed changes
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
    const server = http.createServer(app);
    createSocketServer(server, app);
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start backend:", error);
    process.exit(1);
  }
}

startServer();

module.exports = app;

