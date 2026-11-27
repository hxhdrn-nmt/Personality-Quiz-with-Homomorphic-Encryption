import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
  },
  server: {
    allowedHosts: ['finished-excluding-afar.ngrok-free.dev']
  },
  base: '/Personality-Quiz-with-Homomorphic-Encryption/'
})
