import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    // stylesheets are real inputs here: SubpageLayout.test.tsx reads SubpageLayout.css (`?raw`) to
    // check the selectors that decide keyboard state
    css: true,
  },
})
