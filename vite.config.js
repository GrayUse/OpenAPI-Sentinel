import { defineConfig } from 'vite';
import { resolve } from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  root: 'src',
  base: './',
  publicDir: resolve(__dirname, 'public'),
  server: {
    port: 5173,
  },
  plugins: [
    nodePolyfills({
      include: ['path', 'fs', 'os'],
      globals: { Buffer: true, global: true, process: true },
    }),
  ],
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    include: ['monaco-editor']
  }
});
