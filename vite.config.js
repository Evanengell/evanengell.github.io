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
        entryFileNames: `assets/[name]-[hash]-v3.3.3.js`,
        chunkFileNames: `assets/[name]-[hash]-v3.3.3.js`,
        assetFileNames: `assets/[name]-[hash]-v3.3.3.[ext]`
      }
    }
  }
})
