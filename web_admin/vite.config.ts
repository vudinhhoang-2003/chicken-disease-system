import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Mở cho Docker truy cập
    port: 5173,
    watch: {
      usePolling: true, // QUAN TRỌNG: Giúp Docker trên Windows nhận diện file thay đổi
    },
  },
})