import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 10000,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.spec.ts', // Exclude Playwright E2E tests
      '**/e2e/**',
    ],
    include: ['**/*.test.ts'], // Only run .test.ts files
  },
})
