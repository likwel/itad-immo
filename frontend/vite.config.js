import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: { 
    allowedHosts: ['lavina-nongrieving-gabriella.ngrok-free.dev'],
    proxy: { 
    '/api': 'http://localhost:4000',
  } 
},
})
