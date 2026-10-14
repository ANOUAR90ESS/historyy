import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    proxy: { '/api': { target: process.env.API_PROXY_TARGET || 'http://localhost:3001', changeOrigin: false } },
    watch: process.env.BASE44_PREVIEW_MODE === '1' ? { usePolling: true } : undefined,
  },
});
