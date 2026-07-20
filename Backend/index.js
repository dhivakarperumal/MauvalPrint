const express = require("express");
const cors = require("cors");
const http = require("http");
const https = require("https");
const { connectDB } = require("./src/config/db");
const userRoutes = require("./src/routers/userRoutes");
const productRoutes = require("./src/routers/productRoutes");
const categoryRoutes = require("./src/routers/categoryRoutes");
const orderRoutes = require("./src/routers/orderRoutes");
const printOrderRoutes = require("./src/routers/printOrderRoutes");
const reviewRoutes = require("./src/routers/reviewRoutes");
const dealerRoutes = require("./src/routers/dealerRoutes");
const invoiceRoutes = require("./src/routers/invoiceRoutes");
const keywordRoutes = require("./src/routers/keywordRoutes");
const wishlistRouter = require("./src/routers/wishlist");
const cartRouter = require("./src/routers/cart");
const videoRoutes = require("./src/routers/videoRoutes");
const logoRoutes = require("./src/routers/logoRoutes");
const logoCartRoutes = require("./src/routers/logoCartRoutes");
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

// Favicon handler - prevents 500 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No Content
});

// Image proxy endpoint - fetch external images and serve with CORS headers
app.get('/api/proxy-image', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }

    // Validate that the URL is actually a URL
    try {
      new URL(imageUrl);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format'
      });
    }

    // Helper: fetch URL following redirects (up to maxRedirects)
    const fetchWithRedirects = (url, maxRedirects = 5) => {
      const parsedUrl = new URL(url);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MauvalPrintProxy/1.0)'
        }
      };

      protocol.get(url, options, (response) => {
        // Follow redirects (301, 302, 303, 307, 308)
        if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
          if (maxRedirects <= 0) {
            return res.status(502).json({ success: false, message: 'Too many redirects' });
          }
          // Resolve relative redirect URLs
          const redirectUrl = new URL(response.headers.location, url).toString();
          return fetchWithRedirects(redirectUrl, maxRedirects - 1);
        }

        // Check for HTTP errors
        if (response.statusCode < 200 || response.statusCode >= 300) {
          return res.status(response.statusCode).json({
            success: false,
            message: 'Failed to fetch image from external server',
            statusCode: response.statusCode
          });
        }

        // Set appropriate headers
        res.set('Content-Type', response.headers['content-type'] || 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=3600');
        res.set('Access-Control-Allow-Origin', '*');
        
        // Pipe the response
        response.pipe(res);
      }).on('error', (error) => {
        console.error('Image proxy error:', error.message);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Failed to fetch image',
            error: error.message
          });
        }
      });
    };

    fetchWithRedirects(imageUrl);
  } catch (error) {
    console.error('Image proxy error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to process image request',
      error: error.message
    });
  }
});

// upload route
const uploadRoutes = require('./src/routers/uploadRoutes');
app.use('/api', uploadRoutes);

// ─── File streaming endpoint with Range request support ──────────────────────
// GET /api/stream/<category>/<filename>
// Supports HTTP 206 Partial Content so browsers can seek/scrub video files.
// Also serves images (thumbnails). Uses app.use() because Express 5 dropped
// wildcard (*) route support.
//
// FALLBACK: if the exact path doesn't exist (legacy records with wrong
// category in DB), we search all upload subdirectories by filename.
const fs   = require('fs');
const mime = require('mime-types');
app.use('/api/stream', (req, res) => {
  const relativePath   = req.path.replace(/^\//, ''); // strip leading /
  const uploadsDir     = path.join(__dirname, 'public', 'uploads');
  let   filePath       = path.join(uploadsDir, relativePath);

  // ── Fallback: search every subdir for the filename ──────────────────────
  if (!relativePath || !fs.existsSync(filePath)) {
    const filename = path.basename(relativePath);
    if (!filename) return res.status(404).json({ success: false, message: 'File not found' });

    let found = false;
    if (fs.existsSync(uploadsDir)) {
      for (const subdir of fs.readdirSync(uploadsDir)) {
        const candidate = path.join(uploadsDir, subdir, filename);
        if (fs.existsSync(candidate)) {
          filePath = candidate;
          found = true;
          break;
        }
      }
    }
    if (!found) return res.status(404).json({ success: false, message: 'File not found' });
  }

  const stat     = fs.statSync(filePath);
  const fileSize = stat.size;
  const mimeType = mime.lookup(filePath) || 'application/octet-stream';

  // CORS + range support headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Range');
  res.setHeader('Accept-Ranges', 'bytes');

  const rangeHeader = req.headers.range;
  if (rangeHeader) {
    const parts     = rangeHeader.replace(/bytes=/, '').split('-');
    const start     = parseInt(parts[0], 10);
    const end       = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 1024 * 1024 - 1, fileSize - 1);
    const chunkSize = end - start + 1;
    res.writeHead(206, {
      'Content-Range':  `bytes ${start}-${end}/${fileSize}`,
      'Content-Length': chunkSize,
      'Content-Type':   mimeType,
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type':   mimeType,
    });
    fs.createReadStream(filePath).pipe(res);
  }
});


// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

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

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/print-orders", printOrderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/dealers", dealerRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/keywords", keywordRoutes);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/cart", cartRouter);
app.use("/api/videos", videoRoutes);
app.use("/api/logos", logoRoutes);
app.use("/api/logo-cart", logoCartRoutes);

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

// Global error handler to capture unexpected errors and log request body for diagnostics
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err && err.stack ? err.stack : err);
  try { console.error('Request body at error time:', JSON.stringify(req.body)); } catch (e) { console.error('Failed to stringify request body'); }
  if (!res.headersSent) {
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (err && err.message) ? err.message : 'Internal server error';
    res.status(500).json({ success: false, message: msg });
  } else {
    next(err);
  }
});

