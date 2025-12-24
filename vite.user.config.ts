import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 个人库配置 - 端口 3208
export default defineConfig({
    plugins: [
        react(),
        // 开发服务器中间件：将根路径重定向到 user.html
        {
            name: 'rewrite-root',
            configureServer(server) {
                server.middlewares.use((req, _res, next) => {
                    if (req.url === '/') {
                        req.url = '/user.html';
                    }
                    next();
                });
            },
        },
    ],
    server: {
        host: '127.0.0.1',
        port: 3208,
        strictPort: true,
        hmr: {
            timeout: 60000,
        },
    },
    build: {
        outDir: 'dist/user',
        rollupOptions: {
            input: 'user.html',
        },
    },
});
