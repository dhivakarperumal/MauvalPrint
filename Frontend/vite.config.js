import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    port: 5173, // ensure consistent port for proxying
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        // target: "https://printmy.qtechx.com",
        changeOrigin: true,
        secure: false,
      },
      '/proxy-uploads': {
        target: 'https://mauvalprint.in/uploads',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy-uploads/, '')
      }
    }
  }
})
