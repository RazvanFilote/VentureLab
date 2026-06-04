import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// Reuse the backend's self-signed cert so the SPA and API share one TLS chain
// (the phone only has to accept the warning once, not twice). If the cert
// hasn't been generated yet, fall through to plain HTTP so npm scripts that
// don't need HTTPS (build, vitest) still work.
function loadCert() {
  const certPath = path.resolve(__dirname, 'backend/certs/dev-cert.pem')
  const keyPath = path.resolve(__dirname, 'backend/certs/dev-key.pem')
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    return {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
    }
  }
  return undefined
}

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  server: {
    host: true,
    port: 5174,
    strictPort: true,
    https: loadCert(),
  },

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/app/**/*.{ts,tsx}'],
      exclude: ['src/app/components/**'],
    },
  },
})
