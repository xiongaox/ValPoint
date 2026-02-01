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
import AdmZip from 'adm-zip';

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
const MAP_TRANSLATIONS = {
    'Ascent': "亚海悬城",
    'Bind': "源工重镇",
    'Breeze': "微风岛屿",
    'Fracture': "裂变峡谷",
    'Haven': "隐世修所",
    'Icebox': "森寒冬港",
    'Lotus': "莲华古城",
    'Pearl': "深海明珠",
    'Split': "霓虹町",
    'Sunset': "日落之城",
    'Abyss': "幽邃地窟",
    'Corrode': "盐海矿镇",
};

const AGENT_TRANSLATIONS = {
    'Phoenix': '不死鸟', 'Jett': '捷风', 'Sova': '猎枭', 'Sage': '贤者', 'Cypher': '零',
    'Killjoy': '奇乐', 'Raze': '雷兹', 'Viper': '蝰蛇', 'Brimstone': '炼狱', 'Omen': '幽影',
    'Breach': '铁臂', 'Reyna': '芮娜', 'Skye': '斯凯', 'Yoru': '夜露', 'Astra': '星礈',
    'KAY/O': 'K/O', 'Chamber': '尚勃勒', 'Neon': '霓虹', 'Fade': '黑梦', 'Harbor': '海神',
    'Gekko': '盖可', 'Deadlock': '钢锁', 'Iso': '壹决', 'Clove': '暮蝶', 'Vyse': '维斯',
    'Teafox': '钛狐'
};

const sanitize = (str) => {
    if (!str) return '';
    // 允许中文字符，移除危险字符
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

/**
 * POST /api/upload/zip - 导入 ZIP 点位包
 * 规范文件名：地图_英雄_技能槽位_点位标题.zip
 * 内部文件：站位.webp, 瞄点.webp, 落位.webp 等
 */
router.post('/zip', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传文件' });
        }

        const zip = new AdmZip(req.file.buffer);
        const zipEntries = zip.getEntries();

        // 1. 获取基础元数据（从文件名，作为兜底）
        const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
        const zipName = originalName.replace(/\.zip$/i, '');
        const parts = zipName.split('_');

        let metadata = {
            mapName: parts[0] || 'Unknown',
            agentName: parts[1] || 'Unknown',
            slot: parts[2] || 'Ability',
            title: parts.slice(3).join('_') || 'Untitled',
            side: 'attack',
            agent_pos: { lat: 0, lng: 0 },
            skill_pos: { lat: 0, lng: 0 }
        };

        if (metadata.title.startsWith('防守')) metadata.side = 'defense';

        // 2. 搜索并解析 JSON 描述文件
        const jsonEntry = zipEntries.find(e => e.entryName.toLowerCase().endsWith('.json') && !e.isDirectory);
        if (jsonEntry) {
            try {
                const jsonData = JSON.parse(jsonEntry.getData().toString('utf8'));
                // 使用 JSON 中的数据覆盖文件名解析的数据 (支持下划线和驼峰)
                if (jsonData.map_name || jsonData.mapName) metadata.mapName = jsonData.map_name || jsonData.mapName;
                if (jsonData.agent_name || jsonData.agentName) metadata.agentName = jsonData.agent_name || jsonData.agentName;
                if (jsonData.title) metadata.title = jsonData.title;
                if (jsonData.side) metadata.side = jsonData.side;
                if (jsonData.agent_pos || jsonData.agentPos) metadata.agent_pos = jsonData.agent_pos || jsonData.agentPos;
                if (jsonData.skill_pos || jsonData.skillPos) metadata.skill_pos = jsonData.skill_pos || jsonData.skillPos;
                if (jsonData.ability_index !== undefined) metadata.ability_index = jsonData.ability_index;

                // 显式提取描述、链接和作者信息 (支持驼峰与下划线兼容)
                const fields = [
                    'stand_desc', 'stand_desc', 'stand2_desc', 'stand2_desc',
                    'aim_desc', 'aim_desc', 'aim2_desc', 'aim2_desc',
                    'land_desc', 'land_desc', 'source_link', 'sourceLink',
                    'author_name', 'authorName', 'author_avatar', 'authorAvatar',
                    'author_uid', 'authorUid'
                ];

                // 站位描述
                metadata.stand_desc = jsonData.stand_desc || jsonData.standDesc || "";
                metadata.stand2_desc = jsonData.stand2_desc || jsonData.stand2Desc || "";
                metadata.aim_desc = jsonData.aim_desc || jsonData.aimDesc || "";
                metadata.aim2_desc = jsonData.aim2_desc || jsonData.aim2Desc || "";
                metadata.land_desc = jsonData.land_desc || jsonData.landDesc || "";

                // 链接与作者
                metadata.source_link = jsonData.source_link || jsonData.sourceLink || "";
                metadata.author_name = jsonData.author_name || jsonData.authorName || null;
                metadata.author_avatar = jsonData.author_avatar || jsonData.authorAvatar || null;
                metadata.author_uid = jsonData.author_uid || jsonData.authorUid || null;

            } catch (e) {
                console.warn('JSON 解析失败，回退到文件名解析:', e);
            }
        }

        // 自动翻译点位元数据 (英文 -> 中文)
        metadata.mapName = MAP_TRANSLATIONS[metadata.mapName] || metadata.mapName;
        metadata.agentName = AGENT_TRANSLATIONS[metadata.agentName] || metadata.agentName;

        const { mapName, agentName, slot, title } = metadata;

        // 3. 准备目录 (使用翻译后的名称)
        const safeMap = sanitize(mapName);
        const safeAgent = sanitize(agentName);
        const safeTitle = sanitize(title);
        const targetDir = path.join(IMAGES_DIR, safeMap, safeAgent, safeTitle);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        const resultPaths = {};

        // 4. 处理内部图片文件
        // ZIP 内部可能包含文件夹，也可能有不同后缀，这里使用更灵活的模糊匹配
        for (const entry of zipEntries) {
            if (entry.isDirectory) continue;

            const entryNameLow = entry.entryName.toLowerCase();
            let targetFileName = '';
            let fieldName = '';

            // 站位图匹配 (stand)
            if (entryNameLow.includes('站位') || entryNameLow.includes('stand')) {
                if (entryNameLow.includes('2')) {
                    targetFileName = `${slot}_站位2.webp`;
                    fieldName = 'stand2_img';
                } else {
                    targetFileName = `${slot}_站位.webp`;
                    fieldName = 'stand_img';
                }
            }
            // 瞄点图匹配 (aim)
            else if (entryNameLow.includes('瞄点') || entryNameLow.includes('aim')) {
                if (entryNameLow.includes('2')) {
                    targetFileName = `${slot}_瞄点2.webp`;
                    fieldName = 'aim2_img';
                } else {
                    targetFileName = `${slot}_瞄点.webp`;
                    fieldName = 'aim_img';
                }
            }
            // 落位图匹配 (land / target)
            else if (entryNameLow.includes('落位') || entryNameLow.includes('落点') || entryNameLow.includes('land') || entryNameLow.includes('target')) {
                targetFileName = `${slot}_落位.webp`;
                fieldName = 'land_img';
            }

            if (targetFileName && fieldName) {
                const targetPath = path.join(targetDir, targetFileName);
                fs.writeFileSync(targetPath, entry.getData());

                // 统一返回 Web 路径 (使用翻译后的安全路径)
                resultPaths[fieldName] = `/data/images/${safeMap}/${safeAgent}/${safeTitle}/${targetFileName}`;
            }
        }

        res.json({
            success: true,
            metadata,
            paths: resultPaths
        });
    } catch (error) {
        console.error('ZIP 导入失败:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
