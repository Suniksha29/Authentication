/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    manifest: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query', 'lucide-react']
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/oauth2': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/login/oauth2': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/actuator': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      }
    }
  }
});
