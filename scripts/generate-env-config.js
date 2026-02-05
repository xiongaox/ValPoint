/**
 * generate-env-config.js
 * 
 * 职责：
 * - 读取 .env 文件
 * - 提取以 VITE_ 开头的环境变量
 * - 生成 window.__ENV__ 配置对象
 * - 写入 dist/env-config.js
 * 
 * 用途：
 * - 用于静态部署 (如 Aliyun ESA) 场景，替代 Docker 的运行时注入
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. 读取 .env 文件
const envPath = path.resolve(__dirname, '../.env');
const distPath = path.resolve(__dirname, '../dist');
const outputPath = path.join(distPath, 'env-config.js');

if (!fs.existsSync(envPath)) {
    console.warn('Warning: .env file not found at', envPath);
}

// 简单解析 .env
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
const envVars = {};

envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const [key, ...valueParts] = trimmed.split('=');
    if (key && key.startsWith('VITE_')) {
        const value = valueParts.join('=').trim();
        const cleanValue = value.replace(/^['"](.*)['"]$/, '$1');
        envVars[key] = cleanValue;
    }
});

// 2. 合并 process.env 中的 VITE_ 变量 (优先级更高或补充缺失)
Object.keys(process.env).forEach(key => {
    if (key.startsWith('VITE_')) {
        envVars[key] = process.env[key];
    }
});

// 3. 生成配置内容
const configContent = `window.__ENV__ = ${JSON.stringify(envVars, null, 2)};`;

// 3. 确保 dist 目录存在
if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath, { recursive: true });
}

// 4. 写入文件
fs.writeFileSync(outputPath, configContent);

console.log('✅ Generated env-config.js in dist/ for static deployment.');
console.log('Environment variables included:', Object.keys(envVars).join(', '));
