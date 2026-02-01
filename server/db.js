/**
 * SQLite 数据库初始化
 * 
 * 职责：
 * - 创建数据库连接
 * - 初始化表结构
 * - 导出数据库实例
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据目录
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
const DB_PATH = path.join(DATA_DIR, 'valpoint.db');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 创建数据库连接
const db = new Database(DB_PATH);

// 启用 WAL 模式提升并发性能
db.pragma('journal_mode = WAL');

/**
 * 初始化数据库表结构
 */
export function initDatabase() {
    // 创建 lineups 表
    db.exec(`
        CREATE TABLE IF NOT EXISTS lineups (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            map_name TEXT NOT NULL,
            agent_name TEXT NOT NULL,
            side TEXT NOT NULL DEFAULT 'attack',
            ability_index INTEGER,
            agent_pos TEXT,
            skill_pos TEXT,
            stand_img TEXT,
            stand_desc TEXT,
            stand2_img TEXT,
            stand2_desc TEXT,
            aim_img TEXT,
            aim_desc TEXT,
            aim2_img TEXT,
            aim2_desc TEXT,
            land_img TEXT,
            land_desc TEXT,
            source_link TEXT,
            author_name TEXT,
            author_avatar TEXT,
            author_uid TEXT,
            creator_id TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        )
    `);

    // 创建索引加速查询
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_lineups_map ON lineups(map_name);
        CREATE INDEX IF NOT EXISTS idx_lineups_agent ON lineups(agent_name);
        CREATE INDEX IF NOT EXISTS idx_lineups_created ON lineups(created_at DESC);
    `);

    console.log('✅ Database initialized successfully');
}

export default db;
