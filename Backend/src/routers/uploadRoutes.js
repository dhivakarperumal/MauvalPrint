const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Storage config — store under Backend/public/uploads/<category>/
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const category = req.body.category || 'products';
    const dest = path.join(__dirname, '..', '..', 'public', 'uploads', category);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${unique}-${safeName}`);
  }
});

const upload = multer({ storage });

// POST /api/upload
// fields: files[] (multipart), category (optional)
router.post('/upload', upload.array('files[]', 10), (req, res) => {
  try {
    const files = req.files || [];
    const category = req.body.category || 'products';
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const urls = files.map((f) => `${baseUrl}/uploads/${encodeURIComponent(category)}/${encodeURIComponent(path.basename(f.path))}`);
    return res.json({ success: true, urls });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ success: false, message: 'Upload failed', error: err.message });
  }
});

module.exports = router;
