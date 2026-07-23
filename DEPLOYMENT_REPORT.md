# Mauval Print Deployment Audit

## Overview

This project has separate frontend and backend apps:
- `Frontend/` is a Vite + React app
- `Backend/` is an Express API with MySQL database support
- Root `package.json` provides local `dev` orchestration only

No `.env` file was found in the workspace, so environment variables must be provided before deployment.

---

## Frontend Configuration

### Entry points
- `Frontend/vite.config.js` is the Vite config
- `Frontend/src/api.js` is the HTTP client base URL layer
- `Frontend/src/main.jsx` and `Frontend/src/Components/Login.jsx` read `VITE_GOOGLE_CLIENT_ID`

### Dev behavior
- Vite dev server runs on port `5173`
- Proxy rules in `Frontend/vite.config.js`:
  - `/api` → `process.env.VITE_BACKEND_URL` or `http://localhost:5000`
  - `/proxy-uploads` → `${VITE_BACKEND_URL}/uploads` or `http://localhost:5000/uploads`

### Production build behavior
- `Frontend/src/api.js` uses `import.meta.env.VITE_API_URL`
- If `VITE_API_URL` is not set, it falls back to `/api`
- That means production must either:
  - serve frontend and backend from the same domain with backend mounted at `/api`, or
  - set `VITE_API_URL` to the full backend URL at build time

### Important frontend env vars
- `VITE_API_URL` - backend base URL for built app
- `VITE_GOOGLE_CLIENT_ID` - optional Google OAuth client ID
- `VITE_BACKEND_URL` - dev-only proxy target in Vite config

---

## Backend Configuration

### Entry point
- `Backend/index.js` is the server startup file
- It loads `dotenv` and starts Express on `process.env.PORT || 5000`

### Database config
- `Backend/src/config/db.js` loads `Backend/.env` via `dotenv.config({ path: path.resolve(__dirname, '../../.env') })`
- Required DB env vars:
  - `DB_HOST`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_NAME`
  - `DB_PORT`
- Optional admin defaults are also supported:
  - `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_USERNAME`

### Backend routes
- Backend serves static uploads from `/uploads`
- API routes are mounted under `/api/*`
- Health check endpoint: `/api/health`
- Root endpoint: `/`

### Backend env vars
- `PORT` - listen port
- `NODE_ENV` - production/dev mode
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_USERNAME`

---

## Deployment Risks / Gaps

1. No `.env` file exists in the repository.
   - Backend will not have DB credentials or runtime settings unless you add `Backend/.env`.

2. The root `package.json` only supports local development.
   - It does not provide a production build or serve command for deployment.

3. The backend does not currently serve the built frontend.
   - There is no `express.static` configured for `Frontend/dist` in `Backend/index.js`.
   - If you want a single deployable backend + frontend app, add static serve logic.

4. Frontend production behavior depends on `VITE_API_URL`.
   - If frontend is hosted separately, you must set it to the backend URL during build.

---

## Deployment Checklist

### Local dev
1. Install dependencies:
   - `cd Backend && npm install`
   - `cd Frontend && npm install`
2. Start both apps locally:
   - From root: `npm run dev`
   - This runs `Backend` and `Frontend` concurrently

### Build frontend for production
1. `cd Frontend`
2. `npm run build`

### Production options

#### Option A: Separate frontend + backend deploy
- Deploy `Frontend/dist` to a static host or CDN
- Set `VITE_API_URL` to the backend URL at build time
- Ensure backend CORS allows the frontend origin if needed

#### Option B: Single backend-hosted deploy
- Add Express static serving for `Frontend/dist` to `Backend/index.js`
- Set `VITE_API_URL=/api` when building frontend
- Deploy backend and static assets together

---

## Recommended env examples

### `Backend/.env`
```
PORT=5000
NODE_ENV=production
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=mauvalprint_db
DB_PORT=3306
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin@123
ADMIN_USERNAME=admin
```

### `Frontend/.env.production`
```
VITE_API_URL=https://api.example.com/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### `Frontend/.env.development`
```
VITE_BACKEND_URL=http://localhost:5000
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

---

## Summary

The project is structured correctly for local development, but production deployment requires explicit env configuration and either:
- static frontend hosting with `VITE_API_URL`, or
- backend integration to serve the frontend build.

If you want, I can also add a `Backend` static serve block and a `Frontend` `.env.example` file for deployment.
