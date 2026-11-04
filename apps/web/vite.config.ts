import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // The browser only talks to /api; keys stay on the server.
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
});
