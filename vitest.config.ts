import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@content': path.resolve(__dirname, './content'),
    },
  },
  test: {
    // Only run unit tests — e2e tests live in tests/e2e/ and use Playwright
    include: ['tests/lib/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/lib/**/*.ts'],
    },
  },
});
