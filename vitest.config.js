import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    // Use jsdom environment to simulate a browser
    environment: 'jsdom',

    // Setup files run before each test file
    setupFiles: ['./src/__tests__/setup.js'],

    // Global test utilities available without importing
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'src/__tests__/**',
        'dist/**',
        '*.config.js',
        'src/main.jsx',
        'src/assets/**',
      ],
      thresholds: {
        lines: 30,      // Start low; increase as test coverage grows
        functions: 30,
        branches: 20,
        statements: 30,
      },
    },

    // Include patterns
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['node_modules', 'dist'],
  },
})
