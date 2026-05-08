import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/


export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        // Aquí puedes dejar el localhost para tu PC
        target: 'http://localhost:3000', 
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
/**export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})*/