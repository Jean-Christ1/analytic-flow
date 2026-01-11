// ============================================================================
// Vitest Configuration
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/index.ts',
      ],
    },
    // Mock timers for testing async operations
    fakeTimers: {
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
    },
    // Isolate tests for better reliability
    isolate: true,
    // Test timeout (30 seconds)
    testTimeout: 30000,
    // Hook timeout (10 seconds)
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
