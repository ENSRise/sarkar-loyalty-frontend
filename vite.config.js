import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://sarkar-backend.ensrise.xyz',
        changeOrigin: true,
        secure: false,  // Allow self-signed or mixed SSL
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        headers: {
          'Content-Type': 'application/json',
        },
      },
    },
  },
});