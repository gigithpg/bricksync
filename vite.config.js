import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    host: true,
    hmr: {
      clientPort: 3001,
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'axios'],
          'react-bootstrap': ['react-bootstrap'],
          chartjs: ['chart.js/auto'],
          flatpickr: ['flatpickr', 'react-flatpickr'],
        },
      },
    },
  },
});