/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Pure-logic tests run in Node; DOM-touching tests opt in per-file.
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // cubing.js solve/scramble spin up web workers that don't run under the Node
    // test environment; those round-trips are verified via the headless harness.
    testTimeout: 15000,
  },
})
