/**
 * 图片上传 API 路由
 * 
 * 职责：
 * - 接收图片上传
 * - 按照 [Map]/[Agent]/[Title] 结构组织目录
 * - 命名规范：技能[Slot]_[Type].webp (如：技能Q_站位.webp)
 * - 转换为 WebP 格式（无损，本地存储不压缩）
 */

import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 数据目录
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../data');
const IMAGES_DIR = path.join(DATA_DIR, 'images');

// 确保图片目录存在
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Multer 配置 - 内存存储
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    }
});

// 文件名清理函数
const sanitize = (str) => {
    if (!str) return '';
    return String(str).replace(/[\\/:*?"<>|]/g, '_').trim();
};

/**
 * 统一处理图片上传逻辑
 */
async function processImageUpload(buffer, params) {
    const { map, agent, ability, type, lineupTitle, slot } = params;

    const safeMap = sanitize(map) || 'unknown';
    const safeAgent = sanitize(agent) || 'unknown';
    const safeTitle = sanitize(lineupTitle) || 'Untitled';
    const safeType = sanitize(type) || 'image';

    // 如果有槽位信息(C/Q/E/X)，优先使用槽位标识命名，否则使用具体技能名
    let skillId = '';
    if (slot && slot.length === 1) {
        skillId = `技能${slot.toUpperCase()}`;
    } else {
        skillId = sanitize(ability) || 'general';
    }

    // 创建目录层级: Map / Agent / LineupTitle
    const targetDir = path.join(IMAGES_DIR, safeMap, safeAgent, safeTitle);
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    // 生成文件名：技能X_位置.webp (去除了英雄名前缀)
    // 例如：技能Q_站位.webp
    let filename = `${skillId}_${safeType}.webp`;

    // 极端情况清理：如果 skillId 是 general 且没有 type，改为 image.webp
    if (skillId === 'general' && safeType === 'image') {
        filename = 'image.webp';
    }

    const filepath = path.join(targetDir, filename);

    // 使用 sharp 转换为 WebP (无损，本地存储)
    await sharp(buffer)
        .webp({ lossless: true })
        .toFile(filepath);

    // 返回 Web 可直接访问的相对路径 (强制使用正斜杠)
    const relativeWebPath = `/data/images/${safeMap}/${safeAgent}/${safeTitle}/${filename}`;

    return {
        success: true,
        path: relativeWebPath,
        filename: filename
    };
}

/**
 * POST /api/upload - 标准图片上传
 */
router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '未上传文件' });
        }

        const params = {
            map: req.query.map,
            agent: req.query.agent,
            ability: req.query.ability,
            type: req.query.type,
            lineupTitle: req.query.lineupTitle,
            slot: req.query.slot
        };

        const result = await processImageUpload(req.file.buffer, params);
        res.json(result);
    } catch (error) {
        console.error('上传失败:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/upload/base64 - Base64 图片上传
 */
router.post('/base64', async (req, res) => {
    try {
        const { data, map, agent, ability, type, lineupTitle, slot } = req.body;

        if (!data) {
            return res.status(400).json({ error: '缺少图片数据' });
        }

        const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        const params = { map, agent, ability, type, lineupTitle, slot };
        const result = await processImageUpload(buffer, params);
        res.json(result);
    } catch (error) {
        console.error('Base64 上传失败:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
