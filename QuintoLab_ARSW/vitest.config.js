import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.js',
    // Los tests siempre usan el mock: no dependen del backend.
    env: { VITE_USE_MOCK: 'true' },
  },
})
