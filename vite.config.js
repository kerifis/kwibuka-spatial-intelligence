import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        museum: resolve(__dirname, 'museum.html'),
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
