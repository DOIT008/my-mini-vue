import { defineConfig } from "vitest/config";
import { resolve } from "path";
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals:true 
  },
   // 设置别名
   resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});