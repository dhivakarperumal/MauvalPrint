import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'https://printmy.qtechx.com/api',
        // target: 'http://localhost:5000/api',
        changeOrigin: true,
      },
      '/proxy-uploads': {
        target: 'https://mauvalprint.in/uploads',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy-uploads/, '')
      }
    }
  }
})
