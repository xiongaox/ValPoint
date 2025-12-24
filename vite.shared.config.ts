import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 共享库配置 - 端口 3209
export default defineConfig({
    plugins: [
        react(),
        // 开发服务器中间件：将根路径重定向到 shared.html
        {
            name: 'rewrite-root',
            configureServer(server) {
                server.middlewares.use((req, _res, next) => {
                    if (req.url === '/') {
                        req.url = '/shared.html';
                    }
                    next();
                });
            },
        },
    ],
    server: {
        host: '127.0.0.1',
        port: 3209,
        strictPort: true,
        hmr: {
            timeout: 60000,
        },
    },
    build: {
        outDir: 'dist/shared',
        rollupOptions: {
            input: 'shared.html',
        },
    },
});
