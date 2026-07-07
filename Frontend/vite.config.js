import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vite plugin: image proxy middleware for canvas customizer.
// Proxies /proxy-image/<path> → https://printmy.qtechx.com/<path>
// This avoids CORS / tainted canvas issues when drawing external images.
function imageProxyPlugin() {
  return {
    name: 'image-proxy',
    configureServer(server) {
      server.middlewares.use('/proxy-image', async (req, res) => {
        // req.url will be the path AFTER /proxy-image, e.g. /uploads/foo.jpg
        const targetUrl = 'https://printmy.qtechx.com' + req.url;
        try {
          const response = await fetch(targetUrl);
          if (!response.ok) {
            res.writeHead(response.status);
            res.end();
            return;
          }
          const contentType = response.headers.get('content-type');
          if (contentType) res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'public, max-age=86400');
          const buffer = Buffer.from(await response.arrayBuffer());
          res.writeHead(200);
          res.end(buffer);
        } catch (err) {
          console.error('[image-proxy] Error:', err.message);
          res.writeHead(502);
          res.end('Proxy error');
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), imageProxyPlugin()],
  server: {
    port: 5173, // ensure consistent port for proxying
    proxy: {
      "/api": {
        target: process.env.VITE_BACKEND_URL || "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      '/proxy-uploads': {
        target: process.env.VITE_BACKEND_URL ? `${process.env.VITE_BACKEND_URL}/uploads` : 'http://localhost:5000/uploads',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/proxy-uploads/, '')
      }
    }
  }
})
