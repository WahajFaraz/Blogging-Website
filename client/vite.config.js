import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Required polyfills for Vercel
      'path': 'path-browserify',
      'stream': 'stream-browserify',
      'util': 'util/',
      'buffer': 'buffer/',
      'process': 'process/browser',
      'crypto': 'crypto-browserify',
      'http': 'stream-http',
      'https': 'https-browserify',
      'os': 'os-browserify',
      'assert': 'assert/'
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignore specific warnings
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        if (warning.code === 'SOURCEMAP_ERROR') return;
        if (warning.message?.includes('node:path')) return;
        if (warning.message?.includes('Use of eval')) return;
        if (warning.message?.includes('Rollup')) return;
        // Use default for other warnings
        warn(warning);
      },
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          vendor: ['axios', '@tanstack/react-query'],
          ui: ['@radix-ui/react-avatar', '@radix-ui/react-label', '@radix-ui/react-select', '@radix-ui/react-slot']
        }
      }
    }
  },
  define: {
    'process.env': {},
    'process.browser': true,
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    'process.env.NODE_DEBUG': 'false',
    global: 'globalThis',
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || 'https://blogging-website-lyart.vercel.app')
  },
  server: {
    port: 3000,
    strictPort: true
  },
  preview: {
    port: 4173,
    strictPort: true
  }
});
