
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'experimental-jrnotes.umejya.easypanel.host',
      'jrnotes.caedcj.com.br',
    ],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    minify: 'esbuild',
  },
});

/*
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: [
      'experimental-jrnotes.umejya.easypanel.host'
    ],
  },
  build: {
    outDir: 'dist',
    minify: 'esbuild',
  },
});
*/
