// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/chess_app',
  build: {
    sourcemap: true,
  },
  worker: {
    format: 'es',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
    },
  },
  define: {
    global: 'globalThis',
  },
})
