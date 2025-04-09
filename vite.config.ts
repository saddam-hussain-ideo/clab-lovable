
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
  optimizeDeps: {
    force: true,
    include: ['zod']
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Fix Zod module resolution - use the ESM version directly
      "zod": path.resolve(__dirname, "./node_modules/zod/lib/index.mjs"),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  build: {
    sourcemap: mode === 'development',
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules\/zod/, /node_modules\/.*\.js/],
      extensions: ['.js', '.cjs', '.ts', '.mjs'],
      strictRequires: true,
    },
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          zod: ['zod']
        },
        format: 'es',
      },
      onwarn(warning, warn) {
        // Don't warn about zod imports
        if (warning.code === 'UNRESOLVED_IMPORT' && 
           (warning.message?.includes('zod'))) {
          return;
        }
        warn(warning);
      }
    },
    target: 'es2020', // Updated from es2015 to es2020 to support BigInt literals
    chunkSizeWarningLimit: 3000,
  },
  cacheDir: '.vite_cache'
}));
