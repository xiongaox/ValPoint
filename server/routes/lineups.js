/**
 * 点位 API 路由
 * 
 * 职责：
 * - CRUD 操作点位数据
 * - 支持按地图、英雄筛选
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';

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
 * DELETE /api/lineups/:id - 删除点位
 */
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;

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
 * DELETE /api/lineups - 批量删除（按条件）
 * Query: ?agent=xxx 删除指定英雄的所有点位
 */
router.delete('/', (req, res) => {
    try {
        const { agent } = req.query;

        if (agent) {
            const result = db.prepare('DELETE FROM lineups WHERE agent_name = ?').run(agent);
            res.json({ success: true, deleted: result.changes });
        } else {
            // 删除所有点位（危险操作，需确认）
            const result = db.prepare('DELETE FROM lineups').run();
            res.json({ success: true, deleted: result.changes });
        }
    } catch (error) {
        console.error('批量删除失败:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
