import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3208,
    strictPort: true,
    hmr: {
      timeout: 60000,
    },
    proxy: {
      // 开发环境：将 /wiki/ 请求代理到 VitePress 开发服务器
      // 注意：使用 /wiki/ 而非 /wiki，避免匹配到 /wiki.html
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
        main: resolve(__dirname, 'index.html'), // 共享库 (默认首页)
        personal: resolve(__dirname, 'user.html'), // 个人库
        admin: resolve(__dirname, 'admin.html'),
        notFound: resolve(__dirname, '404.html'), // 404 页面
      },
    },
  },
});
