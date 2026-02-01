/**
 * 统计 API 路由
 * 
 * 职责：
 * - 提供点位统计数据
 */

import express from 'express';
import db from '../db.js';

const router = express.Router();

/**
 * GET /api/stats - 获取点位统计
 */
router.get('/', (req, res) => {
    try {
        // 总点位数
        const totalResult = db.prepare('SELECT COUNT(*) as total FROM lineups').get();

        // 按英雄统计
        const byAgent = db.prepare(`
            SELECT agent_name, COUNT(*) as count 
            FROM lineups 
            GROUP BY agent_name 
            ORDER BY count DESC
        `).all();

        // 按地图统计
        const byMap = db.prepare(`
            SELECT map_name, COUNT(*) as count 
            FROM lineups 
            GROUP BY map_name 
            ORDER BY count DESC
        `).all();

        res.json({
            total: totalResult.total,
            byAgent: byAgent,
            byMap: byMap
        });
    } catch (error) {
        console.error('获取统计失败:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
