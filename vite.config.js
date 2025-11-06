import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash]-v2.0.0.js`,
        chunkFileNames: `assets/[name]-[hash]-v2.0.0.js`,
        assetFileNames: `assets/[name]-[hash]-v2.0.0.[ext]`
      }
    }
  }
})
