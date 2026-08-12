import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['./tests/global-setup.ts'],
    setupFiles: ['./tests/setup.ts'],
    // Tests share one database and truncate between cases, so they must not
    // run concurrently across files.
    fileParallelism: false,
  },
})
