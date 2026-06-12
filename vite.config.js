/*
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 3000,
  },
  build: {
    outDir: 'dist',
    minify: 'esbuild',
  },
});
*/

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