import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // ─── Path alias ───────────────────────────────────────────────────────────
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },

  // ─── Build optimizations ──────────────────────────────────────────────────
  build: {
    // Target modern browsers — reduces polyfill weight
    target: 'es2020',

    // Raise the warning threshold to 1 MB (single page apps with many features)
    chunkSizeWarningLimit: 1000,

    rollupOptions: {
      output: {
        // Manual chunk splitting — vendor libraries that change rarely are
        // cached separately from app code that changes frequently.
        manualChunks: {
          // React ecosystem (rarely changes)
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],

          // Supabase client (rarely changes)
          'vendor-supabase': ['@supabase/supabase-js'],

          // Icon library
          'vendor-icons': ['lucide-react'],

          // Image utility
          'vendor-image': ['html-to-image'],
        },
      },
    },
  },

  // ─── Dev server ───────────────────────────────────────────────────────────
  server: {
    port: 5173,
    // Proxy any /api/* calls to the Supabase edge functions if needed in future
    // proxy: { '/api': 'http://localhost:3000' },
  },

  // ─── Preview server (mimics Cloudflare Pages SPA mode) ───────────────────
  preview: {
    port: 4173,
  },
})
