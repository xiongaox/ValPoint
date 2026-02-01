/**
 * ValPoint 本地后端服务
 * 
 * 职责：
 * - 提供 RESTful API 服务
 * - 管理 SQLite 数据库
 * - 处理图片上传和格式转换
 * - 代理外部 API 请求
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db.js';
import lineupsRouter from './routes/lineups.js';
import uploadRouter from './routes/upload.js';
import proxyRouter from './routes/proxy.js';
import statsRouter from './routes/stats.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3209;

// 中间件
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS 配置
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// 静态文件服务
app.use('/data', express.static(path.join(__dirname, '../data')));
app.use(express.static(path.join(__dirname, '../dist')));

// API 路由
app.use('/api/lineups', lineupsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/proxy', proxyRouter);
app.use('/api/stats', statsRouter);

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA 回退
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// 初始化数据库并启动服务
initDatabase();

app.listen(PORT, () => {
    console.log(`🚀 ValPoint Server running on http://localhost:${PORT}`);
});

export default app;
