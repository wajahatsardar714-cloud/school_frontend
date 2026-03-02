import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Serve index.html for every 404 so that React Router handles the URL
    historyApiFallback: true,
  },
  preview: {
    // Same fallback for `vite preview`
    historyApiFallback: true,
  },
})
