/**
 * 点位 API 路由
 * 
 * 职责：
 * - CRUD 操作点位数据
 * - 支持按地图、英雄筛选
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { fileURLToPath } from 'url';
import db from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取外部技能图标映射
const abilityOverridesPath = path.resolve(__dirname, '../../src/data/ability_overrides.json');
let abilityOverrides = {};
try {
    abilityOverrides = JSON.parse(fs.readFileSync(abilityOverridesPath, 'utf8'));
} catch (e) {
    console.warn('[Export] Failed to load ability_overrides.json');
}

const router = express.Router();

/**
 * GET /api/lineups - 获取点位列表
 * Query: ?map=xxx&agent=xxx
 */
router.get('/', (req, res) => {
    try {
        const { map, agent } = req.query;

        let sql = 'SELECT * FROM lineups WHERE 1=1';
        const params = [];

        if (map) {
            sql += ' AND map_name = ?';
            params.push(map);
        }
        if (agent) {
            sql += ' AND agent_name = ?';
            params.push(agent);
        }

        sql += ' ORDER BY created_at DESC';

        const rows = db.prepare(sql).all(...params);

        // 解析 JSON 字段
        const lineups = rows.map(row => ({
            ...row,
            agent_pos: row.agent_pos ? JSON.parse(row.agent_pos) : null,
            skill_pos: row.skill_pos ? JSON.parse(row.skill_pos) : null,
        }));

        res.json(lineups);
    } catch (error) {
        console.error('获取点位失败:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/lineups/:id - 获取单个点位
 */
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const row = db.prepare('SELECT * FROM lineups WHERE id = ?').get(id);

        if (!row) {
            return res.status(404).json({ error: '点位不存在' });
        }

        const lineup = {
            ...row,
            agent_pos: row.agent_pos ? JSON.parse(row.agent_pos) : null,
            skill_pos: row.skill_pos ? JSON.parse(row.skill_pos) : null,
        };

        res.json(lineup);
    } catch (error) {
        console.error('获取点位详情失败:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/lineups - 创建点位
 */
router.post('/', (req, res) => {
    try {
        const data = req.body;
        const id = uuidv4();
        const now = new Date().toISOString();

        const stmt = db.prepare(`
            INSERT INTO lineups (
                id, title, map_name, agent_name, side, ability_index,
                agent_pos, skill_pos, stand_img, stand_desc, stand2_img, stand2_desc,
                aim_img, aim_desc, aim2_img, aim2_desc, land_img, land_desc,
                source_link, author_name, author_avatar, author_uid, creator_id, created_at, updated_at
            ) VALUES (
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?
            )
        `);

        stmt.run(
            id,
            data.title || '',
            data.map_name || '',
            data.agent_name || '',
            data.side || 'attack',
            data.ability_index ?? null,
            data.agent_pos ? JSON.stringify(data.agent_pos) : null,
            data.skill_pos ? JSON.stringify(data.skill_pos) : null,
            data.stand_img || null,
            data.stand_desc || null,
            data.stand2_img || null,
            data.stand2_desc || null,
            data.aim_img || null,
            data.aim_desc || null,
            data.aim2_img || null,
            data.aim2_desc || null,
            data.land_img || null,
            data.land_desc || null,
            data.source_link || null,
            data.author_name || null,
            data.author_avatar || null,
            data.author_uid || null,
            data.creator_id || null,
            now,
            now
        );

        res.status(201).json({ id, ...data, created_at: now, updated_at: now });
    } catch (error) {
        console.error('创建点位失败:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/lineups/:id - 更新点位
 */
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const now = new Date().toISOString();

        // 检查点位是否存在
        const existing = db.prepare('SELECT id FROM lineups WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: '点位不存在' });
        }

        // 构建更新语句
        const fields = [];
        const values = [];

        const allowedFields = [
            'title', 'map_name', 'agent_name', 'side', 'ability_index',
            'stand_img', 'stand_desc', 'stand2_img', 'stand2_desc',
            'aim_img', 'aim_desc', 'aim2_img', 'aim2_desc',
            'land_img', 'land_desc', 'source_link', 'author_name', 'author_avatar', 'author_uid', 'creator_id'
        ];

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(data[field]);
            }
        }

        // 处理 JSON 字段
        if (data.agent_pos !== undefined) {
            fields.push('agent_pos = ?');
            values.push(data.agent_pos ? JSON.stringify(data.agent_pos) : null);
        }
        if (data.skill_pos !== undefined) {
            fields.push('skill_pos = ?');
            values.push(data.skill_pos ? JSON.stringify(data.skill_pos) : null);
        }

        fields.push('updated_at = ?');
        values.push(now);
        values.push(id);

        const sql = `UPDATE lineups SET ${fields.join(', ')} WHERE id = ?`;
        db.prepare(sql).run(...values);

        res.json({ success: true, updated_at: now });
    } catch (error) {
        console.error('更新点位失败:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/lineups - 批量删除点位 (清空所有或按英雄清空)
 * Query: ?agent=xxx
 */
router.delete('/', (req, res) => {
    try {
        const { agent } = req.query;
        let sql = 'SELECT * FROM lineups WHERE 1=1';
        const params = [];

        if (agent) {
            sql += ' AND agent_name = ?';
            params.push(agent);
        }

        // 1. 获取符合条件的所有点位，以便清理物理文件
        const rows = db.prepare(sql).all(...params);

        if (rows.length > 0) {
            const projectRoot = path.resolve(__dirname, '../../');
            const IMAGES_DIR = path.resolve(projectRoot, 'data/images');

            for (const row of rows) {
                const possiblePaths = [row.stand_img, row.stand2_img, row.aim_img, row.aim2_img, row.land_img].filter(Boolean);
                if (possiblePaths.length > 0) {
                    const firstPath = possiblePaths[0];
                    const relPath = firstPath.startsWith('/') ? firstPath.substring(1) : firstPath;
                    const absolutePath = path.resolve(projectRoot, relPath);
                    const targetDir = path.dirname(absolutePath);

                    // 安全校验并删除点位整个文件夹
                    if (targetDir.startsWith(IMAGES_DIR) && targetDir !== IMAGES_DIR) {
                        try {
                            if (fs.existsSync(targetDir)) {
                                fs.rmSync(targetDir, { recursive: true, force: true });
                            }
                        } catch (e) {
                            console.warn(`[Bulk Cleanup] Failed to delete: ${targetDir}`, e.message);
                        }
                    }
                }
            }
        }

        // 2. 执行数据库批量删除
        let deleteSql = 'DELETE FROM lineups WHERE 1=1';
        if (agent) {
            deleteSql += ' AND agent_name = ?';
        }

        const result = db.prepare(deleteSql).run(...params);

        res.json({ success: true, count: result.changes });
    } catch (error) {
        console.error('批量清空点位失败:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/lineups/:id - 删除点位 (同步清理磁盘图片)
 */
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;

        // 1. 先获取点位信息，用于清理物理文件
        const row = db.prepare('SELECT stand_img, stand2_img, aim_img, aim2_img, land_img FROM lineups WHERE id = ?').get(id);

        if (row) {
            // 解析出该点位的专属物理路径
            // 图片路径格式举例: /data/images/亚海悬城/不死鸟/点位标题/技能X_站位.webp
            // 我们只需要删掉最后一个文件名之前的那个文件夹
            const possiblePaths = [row.stand_img, row.stand2_img, row.aim_img, row.aim2_img, row.land_img].filter(Boolean);

            if (possiblePaths.length > 0) {
                const firstPath = possiblePaths[0];

                // 1. 确定项目根目录 (由于后端在 /server 启动，向上级定位)
                const projectRoot = path.resolve(__dirname, '../../');

                // 2. 剥离 Web 路径开头的斜杠
                const relPath = firstPath.startsWith('/') ? firstPath.substring(1) : firstPath;

                // 3. 将 Web 路径转换为绝对物理路径
                const absolutePath = path.resolve(projectRoot, relPath);
                const targetDir = path.dirname(absolutePath);

                // 4. 安全校验：确保确实在项目根目录下的 data/images 目录内
                const IMAGES_DIR = path.resolve(projectRoot, 'data/images');

                if (targetDir.startsWith(IMAGES_DIR) && targetDir !== IMAGES_DIR) {
                    if (fs.existsSync(targetDir)) {
                        fs.rmSync(targetDir, { recursive: true, force: true });
                        console.log(`[Cleanup] Successfully deleted directory: ${targetDir}`);
                    }
                }
            }
        }

        // 2. 删除数据库记录
        const result = db.prepare('DELETE FROM lineups WHERE id = ?').run(id);

        if (result.changes === 0) {
            return res.status(404).json({ error: '点位不存在' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('删除点位失败:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/lineups/:id/export - 导出点位为 ZIP
 */
router.get('/:id/export', (req, res) => {
    try {
        const { id } = req.params;
        const { nickname } = req.query; // 从查询参数中获取本地昵称
        const row = db.prepare('SELECT * FROM lineups WHERE id = ?').get(id);

        if (!row) {
            return res.status(404).json({ error: '点位不存在' });
        }

        const zip = new AdmZip();

        // 1. 查找图片并添加到 ZIP
        // 图片路径在数据库中是 "data/images/亚海悬城/猎枭/..."
        // 需要找到服务器上的实际物理路径
        // __dirname = .../server/routes
        // projectRoot = .../
        const baseDir = path.resolve(__dirname, '../../');

        const imageFields = [
            { field: 'stand_img', zipName: '站位图.webp' },
            { field: 'stand2_img', zipName: '站位图2.webp' },
            { field: 'aim_img', zipName: '瞄点图.webp' },
            { field: 'aim2_img', zipName: '瞄点图2.webp' },
            { field: 'land_img', zipName: '技能落点图.webp' }
        ];

        console.log('[Export] Base Dir:', baseDir);
        let slot = '通用';
        const abiIdx = row.ability_index;
        if (abiIdx !== null && abiIdx !== undefined) {
            // 对齐标准：0:C, 1:Q, 2:E, 3:X
            const slotMap = ['技能C', '技能Q', '技能E', '技能X'];
            slot = slotMap[abiIdx] || '技能';
        }

        // 地图名称映射
        const MAP_TRANSLATIONS = {
            'Ascent': "亚海悬城", 'Bind': "源工重镇", 'Breeze': "微风岛屿", 'Fracture': "裂变峡谷",
            'Haven': "隐世修所", 'Icebox': "森寒冬港", 'Lotus': "莲华古城", 'Pearl:': "深海明珠",
            'Split': "霓虹町", 'Sunset': "日落之城", 'Abyss': "幽邃地窟", 'Corrode': "盐海矿镇",
            'ascent': "亚海悬城", 'bind': "源工重镇", 'breeze': "微风岛屿", 'fracture': "裂变峡谷",
            'haven': "隐世修所", 'icebox': "森寒冬港", 'lotus': "莲华古城", 'pearl': "深海明珠",
            'split': "霓虹町", 'sunset': "日落之城", 'abyss': "幽邃地窟", 'corrode': "盐海矿镇"
        };
        const rawMapName = row.map_name ? row.map_name.trim() : '';
        const mapNameZh = MAP_TRANSLATIONS[rawMapName] || rawMapName;

        // 处理文件名中的非法字符
        const safeTitle = (row.title || '点位').replace(/[\\/:*?"<>|]/g, '_');
        const baseName = `${mapNameZh}_${row.agent_name}_${slot}_${safeTitle}`;
        const zipFileName = `${baseName}.zip`;
        const jsonFileName = `${baseName}.json`;
        console.log(`[Export] map_name: ${row.map_name} -> ${mapNameZh}`);
        console.log(`[Export] baseName: ${baseName}`);
        console.log(`[Export] Provided Nickname: ${nickname || 'NONE'}`);

        for (const item of imageFields) {
            const relPath = row[item.field];
            if (relPath) {
                // 去除开头的斜杠，确保 path.join 正确拼接
                const safeRelPath = relPath.startsWith('/') ? relPath.slice(1) : relPath;
                const fullPath = path.join(baseDir, safeRelPath);

                const exists = fs.existsSync(fullPath);
                if (exists) {
                    zip.addLocalFile(fullPath, 'images', item.zipName);
                }
            }
        }

        // 3. 生成元数据并添加到 ZIP
        // 图标计算逻辑
        const agentIcon = `/agents/${row.agent_name}.png`;

        // 获取外部技能图标外链
        let skillIcon = `/abilities/${row.agent_name}-${slot.replace('技能', '')}.png`; // 默认本地兜底
        const agentOverride = abilityOverrides[row.agent_name];
        if (agentOverride && agentOverride.iconUrl) {
            const slotKeys = ['Ability1', 'Ability2', 'Grenade', 'Ultimate']; // C, Q, E, X
            const key = slotKeys[abiIdx];
            if (key && agentOverride.iconUrl[key]) {
                skillIcon = agentOverride.iconUrl[key];
            }
        }

        const metadata = {
            id: row.id,
            user_id: row.user_id || "",
            title: row.title,
            map_name: row.map_name, // 回归英文名 (Ascent)
            agent_name: row.agent_name,
            agent_icon: agentIcon,
            skill_icon: skillIcon, // 使用腾讯官网或外部链接
            side: row.side,
            ability_index: row.ability_index,
            agent_pos: row.agent_pos ? JSON.parse(row.agent_pos) : null,
            skill_pos: row.skill_pos ? JSON.parse(row.skill_pos) : null,
            stand_img: row.stand_img ? `images/站位图.webp` : "",
            stand_desc: row.stand_desc || "",
            stand2_img: row.stand2_img ? `images/站位图2.webp` : "",
            stand2_desc: row.stand2_desc || "",
            aim_img: row.aim_img ? `images/瞄点图.webp` : "",
            aim_desc: row.aim_desc || "",
            aim2_img: row.aim2_img ? `images/瞄点图2.webp` : "",
            aim2_desc: row.aim2_desc || "",
            land_img: row.land_img ? `images/技能落点图.webp` : "",
            land_desc: row.land_desc || "",
            source_link: row.source_link || "",
            cloned_from: row.cloned_from || null,
            author_name: row.author_name || null,
            author_avatar: row.author_avatar || null,
            author_uid: row.author_uid || "VALPOINT",
            creator_id: nickname || row.creator_id || null,
            created_at: row.created_at,
            updated_at: row.updated_at
        };
        zip.addFile(jsonFileName, Buffer.from(JSON.stringify(metadata, null, 2)));

        // 3. 发送文件
        const buffer = zip.toBuffer();
        res.set('Content-Type', 'application/zip');
        // 使用标准的 RFC 5987 编码处理非 ASCII 字符
        const encodedFileName = encodeURIComponent(zipFileName).replace(/['()]/g, escape).replace(/\*/g, '%2A');
        res.set('Content-Disposition', `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`);
        res.send(buffer);

    } catch (error) {
        console.error('导出点位失败:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
