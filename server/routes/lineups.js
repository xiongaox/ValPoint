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
                source_link, author_name, author_avatar, created_at, updated_at
            ) VALUES (
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?
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
            'land_img', 'land_desc', 'source_link', 'author_name', 'author_avatar'
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
        const row = db.prepare('SELECT * FROM lineups WHERE id = ?').get(id);

        if (!row) {
            return res.status(404).json({ error: '点位不存在' });
        }

        const zip = new AdmZip();

        // 1. 查找图片并添加到 ZIP
        // 图片路径在数据库中是 "data/images/亚海悬城/猎枭/..."
        // 需要找到服务器上的实际物理路径
        const baseDir = path.resolve(process.cwd()); // 项目根目录

        const imageFields = [
            { field: 'stand_img', zipName: '站位.webp' },
            { field: 'stand2_img', zipName: '站位2.webp' },
            { field: 'aim_img', zipName: '瞄点.webp' },
            { field: 'aim2_img', zipName: '瞄点2.webp' },
            { field: 'land_img', zipName: '落位.webp' }
        ];

        for (const item of imageFields) {
            const relPath = row[item.field];
            if (relPath) {
                const fullPath = path.join(baseDir, relPath);
                if (fs.existsSync(fullPath)) {
                    zip.addLocalFile(fullPath, '', item.zipName);
                }
            }
        }

        // 2. 生成规范文件名
        // 格式：地图_英雄_技能_标题.zip
        // 技能解析：需要获取对应的槽位
        let slot = '通用';
        const abiIdx = row.ability_index;
        if (abiIdx !== null && abiIdx !== undefined) {
            // 这里简单映射。前端通常映射为：0=Q, 1=E, 2=C, 3=X (参考 localAgents 顺序)
            // 但其实数据库已经存了对应的技能名称，不过用户希望用技能Q/E/C/X代替
            // 我们在导出的 ZIP 文件名中尽量体现槽位
            // 注意：由于数据库没存原始槽位 ID，我们尝试从其它地方获取或根据索引推断
            const slotMap = ['技能Q', '技能E', '技能C', '技能X'];
            slot = slotMap[abiIdx] || '技能';
        }

        const zipFileName = `${row.map_name}_${row.agent_name}_${slot}_${row.title}.zip`;

        // 3. 发送文件
        const buffer = zip.toBuffer();
        res.set('Content-Type', 'application/zip');
        res.set('Content-Disposition', `attachment; filename="${encodeURIComponent(zipFileName)}"`);
        res.send(buffer);

    } catch (error) {
        console.error('导出点位失败:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
