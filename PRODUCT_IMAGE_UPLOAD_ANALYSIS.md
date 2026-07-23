# Product Image Upload and Image Handling Analysis

## Overview
This repository already includes an image upload mechanism, but the current product image workflow is split between the front end and a separate GoDaddy upload endpoint. The backend also exposes a local `/api/upload` route under `Backend/src/routers/uploadRoutes.js`, but the admin UI does not use it.

## Current Product Upload Flow
### Frontend
- `Frontend/src/Admin/Products/AddProducts.jsx` handles product creation and editing.
- It uses `uploadToGoDaddy(files, category)` to POST files to `https://mauvalprint.in/api/upload.php`.
- Uploaded image URLs are returned and stored in `product.images` or `sizeChart`.
- If product images exist, they are included in payloads posted to `/products`.
- `handleImageUpload` compresses images client-side using `browser-image-compression` before upload.

### Backend
- `Backend/src/routers/uploadRoutes.js` defines a local upload route at `POST /api/upload`.
- It uses `multer.diskStorage` to store uploaded files under `Backend/public/uploads/<category>/`.
- Files are saved with sanitized names and unique prefixes.
- The response returns public URLs based on the saved path.

### Product API
- `Backend/src/controllers/productController.js` defines `addProduct` and `updateProduct`.
- Product fields include:
  - `images` (JSON array)
  - `images_by_variant` (JSON object)
  - `stock_by_variant` (JSON object)
- Data is stored in the `products` table and JSON fields are serialized as strings.

## Key Issues / Gaps
1. Frontend uses an external GoDaddy upload endpoint, not the local backend upload route.
2. The local `/api/upload` route currently ignores `req.body.category` when determining the actual saved location because multer destination runs before body parsing.
3. There is no documented frontend flow for uploading variant images or full product image analysis.
4. `AddProducts.jsx` has upload logic only for main product images and size charts.
5. The backend handles `images_by_variant` but no UI exists in `AddProducts.jsx` to upload or inspect variant image sets.

## Recommended Fixes
### Backend
1. Fix local upload route so category routing works reliably.
2. Support calling `/api/upload` from the admin UI directly, rather than GoDaddy.
3. Ensure the backend response includes `success` and `urls`.
4. Optionally add a `fileType` field or `imageKind` to support product vs size chart uploads.

### Frontend
1. Rename `uploadToGoDaddy` to `uploadToBackend`, and use the local `/api/upload` endpoint instead of `https://mauvalprint.in/api/upload.php`.
2. Add explicit file input flows for:
   - Main product images.
   - Variant images (e.g. `images_by_variant[color-size] = [url,...]`).
   - Size chart images.
3. Add preview and validation for uploaded image URLs before save.
4. Convert any external image URL upload logic to use local backend when running locally.

## Suggested Code Changes
### Backend route fix
In `Backend/src/routers/uploadRoutes.js`:
- Parse category from `req.body.category` using middleware like `express.urlencoded({ extended: true })` earlier in `Backend/index.js`.
- Or use `multer.fields` and a custom `storage.destination` that inspects `req.query.category` or the original request path.

Example:
```js
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const category = req.body.category || req.query.category || 'products';
    const dest = path.join(__dirname, '..', '..', 'public', 'uploads', category);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename(req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_\.]/g, '_');
    cb(null, `${unique}-${safeName}`);
  }
});
```

### Frontend upload helper
Use local upload route:
```js
const uploadToBackend = async (files, category = 'products') => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files[]', file));
  formData.append('category', category);
  const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data.urls || [];
};
```

### Product image analysis / full image handling
- Add a product admin section to upload images by variant, then store as:
  - `images_by_variant: { 'Red-Large': [url1, url2], 'Blue-Medium': [url3] }`
- Keep `images` as the base product gallery.
- Use `size_chart_image` for the uploaded size chart URL.

## Next Steps
1. Apply the backend upload route fix.
2. Replace external upload endpoint usage in `AddProducts.jsx` and any other admin upload forms.
3. Add a markdown file documenting the upload API and how to test it.

## File to Review
- `Backend/src/routers/uploadRoutes.js`
- `Frontend/src/Admin/Products/AddProducts.jsx`
- `Backend/src/controllers/productController.js`

## Summary
A full product image upload and storage workflow exists, but it currently depends on an external upload service. To make it complete, switch admin uploads to the local backend route and expose variant image handling in the product form.
