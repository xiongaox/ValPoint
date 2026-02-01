/**
 * 下载 Valorant 玩家卡面作为本地头像
 * 
 * 使用方法：node scripts/download-avatars.js
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AVATARS_DIR = path.join(__dirname, '../public/avatars');
const AVATAR_COUNT = 20;
const API_URL = 'https://valorant-api.com/v1/playercards?language=zh-CN';

// 确保目录存在
if (!fs.existsSync(AVATARS_DIR)) {
    fs.mkdirSync(AVATARS_DIR, { recursive: true });
}

async function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
            res.on('error', reject);
        }).on('error', reject);
    });
}

async function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (res) => {
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => { });
            reject(err);
        });
    });
}

async function main() {
    console.log('正在获取玩家卡面列表...');

    const { data } = await fetchJson(API_URL);

    // 过滤可用卡面
    const cards = data.filter(card => !card.isHiddenIfNotOwned && card.displayIcon);

    // 随机选择 20 个
    const shuffled = cards.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, AVATAR_COUNT);

    console.log(`准备下载 ${selected.length} 个头像...`);

    // 下载并保存
    const avatarList = [];
    for (let i = 0; i < selected.length; i++) {
        const card = selected[i];
        const filename = `avatar_${String(i + 1).padStart(2, '0')}.png`;
        const filepath = path.join(AVATARS_DIR, filename);

        console.log(`[${i + 1}/${selected.length}] 下载: ${card.displayName}`);

        try {
            await downloadImage(card.displayIcon, filepath);
            avatarList.push({
                id: i + 1,
                filename: filename,
                name: card.displayName,
                url: `/avatars/${filename}`
            });
        } catch (err) {
            console.error(`下载失败: ${card.displayName}`, err.message);
        }
    }

    // 保存索引文件
    const indexPath = path.join(AVATARS_DIR, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify(avatarList, null, 2));

    console.log(`\n✅ 完成！已下载 ${avatarList.length} 个头像到 public/avatars/`);
    console.log(`索引文件: ${indexPath}`);
}

main().catch(console.error);
