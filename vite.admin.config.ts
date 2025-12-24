import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 后台管理配置 - 端口 3210
export default defineConfig({
    plugins: [
        react(),
        // 开发服务器中间件：将根路径重定向到 admin.html
        {
            name: 'rewrite-root',
            configureServer(server) {
                server.middlewares.use((req, _res, next) => {
                    if (req.url === '/') {
                        req.url = '/admin.html';
                    }
                    next();
                });
            },
        },
    ],
    server: {
        host: '127.0.0.1',
        port: 3210,
        strictPort: true,
        hmr: {
            // 禁用 HMR 超时导致的页面刷新
            timeout: 60000,
        },
    },
    build: {
        outDir: 'dist/admin',
        rollupOptions: {
            input: 'admin.html',
        },
    },
});
