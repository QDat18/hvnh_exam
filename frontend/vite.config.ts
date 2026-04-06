import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  envDir: '../',
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        // 🔥 QUAN TRỌNG: Tắt cảnh báo từ node_modules (Bootstrap)
        quietDeps: true,
        
        // Tắt cụ thể các loại cảnh báo bạn đang gặp phải
        silenceDeprecations: [
          'import', 
          'global-builtin',
          'color-functions', 
          'mixed-decls',
          'legacy-js-api'
        ],
      },
    },
  },
})