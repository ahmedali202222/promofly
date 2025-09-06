import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  server: {
    host: true,              // listen on 0.0.0.0
    hmr: {
      protocol: 'wss',
      host: 'd0c021f47c6f.ngrok-free.app',  // paste your current ngrok host
      clientPort: 443,
    },
  },
})
