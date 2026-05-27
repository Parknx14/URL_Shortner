// =============================================================
// vite.config.js
// =============================================================
// Vite is a modern build tool and dev server for frontend apps.
// It's much faster than the old Create React App (CRA) tool.
//
// WHAT VITE DOES:
//   1. In development: serves files instantly with hot reload
//      (when you save a file, the browser updates immediately)
//   2. In production: bundles all JS/CSS into optimized files
//
// This config tells Vite:
//   - We're using React (needs the React plugin for JSX support)
//   - Our dev server runs on port 5173
//   - Proxy /api requests to our backend on port 5000
//     (avoids CORS issues in development)
// =============================================================

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()], // enables JSX transformation and React fast-refresh

  server: {
    port: 5173, // frontend runs at http://localhost:5173

    // PROXY: forward /api/* requests to the backend
    // Without this, browser would block cross-origin requests.
    // fetch('/api/urls') → actually goes to http://localhost:5000/api/urls
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true, // rewrites the Host header
      },
    },
  },
});
