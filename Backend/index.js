// const express = require("express");
// const cors = require("cors");
// const path = require("path");
// require("dotenv").config();

// // optionally run migrations on start, helps when launching dev server
// // (async () => {
// //   try {
// //     const { runMigrations } = require("./src/config/migrate");
// //     await runMigrations();
// //   } catch (err) {
// //     console.error("migration startup error:", err.message);
// //   }
// // })();



// const app = express();

// // Request logging for debugging
// app.use((req, res, next) => {
//   console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
//   next();
// });

// /* ✅ EXACT CORS FIX - Allow multiple ports */
// app.use(
//   cors({
//     origin: (origin, callback) => {
//       if (!origin) return callback(null, true);
//       try {
//         const url = new URL(origin);
//         const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
//         if (isLocalhost) return callback(null, true);
//       } catch (err) {}
//       const allowed = ["https://dapfitt.com"];
//       if (allowed.includes(origin)) return callback(null, true);
//       callback(new Error("Not allowed by CORS"));
//     },
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true,
//   })
// );

// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ limit: '50mb', extended: true }));



// // Health check
// app.get("/api/health", (req, res) => res.json({ ok: true }));



// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Backend running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
// });

// module.exports = app;


const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Enable CORS for all origins
app.use(cors());

// Parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

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

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;