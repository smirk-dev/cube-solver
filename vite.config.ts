/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// cubejs is a non-strict CommonJS module that reads `this.Cube` at load time
// (browser-global fallback). Bundlers make top-level `this` undefined, so that
// read throws and crashes the app. Point it at the global instead: the lookup
// yields undefined and cubejs falls back to require().
function fixCubejsThis(): Plugin {
  return {
    name: 'fix-cubejs-this',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('cubejs') && code.includes('this.Cube')) {
        return { code: code.replace(/this\.Cube/g, 'globalThis.Cube'), map: null }
      }
      return null
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), fixCubejsThis()],
  // Let the plugin (not esbuild's dep pre-bundle) process cubejs, so the fix
  // applies in dev as well as in the production build.
  optimizeDeps: {
    exclude: ['cubejs'],
  },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    testTimeout: 15000,
  },
})
