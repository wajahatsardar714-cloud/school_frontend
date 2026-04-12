import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    proxy: {
      '/api': {
        target: 'https://api.mphsslar.com',
        changeOrigin: true,
        secure: true,
      },
      '/health': {
        target: 'https://api.mphsslar.com',
        changeOrigin: true,
        secure: true,
      },
    },
    // This is the key fix for SPA routing in development
    historyApiFallback: {
      index: '/index.html',
      rewrites: [
        { from: /^\/api/, to: function(context) { return context.parsedUrl.pathname } },
        { from: /./, to: '/index.html' }
      ]
    }
  },
  preview: {
    port: 4173,
    host: true,
    // Same fallback for production preview
    historyApiFallback: {
      index: '/index.html',
      rewrites: [
        { from: /^\/api/, to: function(context) { return context.parsedUrl.pathname } },
        { from: /./, to: '/index.html' }
      ]
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    },
    sourcemap: false,
    minify: 'terser'
  }
})
