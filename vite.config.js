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
        main:     resolve(__dirname, 'index.html'),
        memorial: resolve(__dirname, 'memorial.html'),
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
