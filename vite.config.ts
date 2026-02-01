import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3210,
    strictPort: true,
    hmr: {
      timeout: 60000,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3209',
        changeOrigin: true,
      },
      '/data': {
        target: 'http://localhost:3209',
        changeOrigin: true,
      },
      // 开发环境：将 /wiki/ 请求代理到 VitePress 开发服务器
      '/wiki/': {
        target: 'http://localhost:5173',
        changeOrigin: true,
      },
    },
  },
  appType: 'mpa', // 多页应用模式，禁用 SPA 路由回退
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),

      },
    },
  },
});
