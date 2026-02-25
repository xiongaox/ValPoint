/**
 * upload_playercards_to_oss - 脚本层
 *
 * 模块定位：
 * - 所在层级：脚本层
 * - 主要目标：承载构建、发布与运维辅助脚本
 *
 * 关键职责：
 * - 串联构建、发布、部署相关步骤
 * - 输出明确日志并在异常时快速失败
 * - 保持与 CI 工作流调用方式一致
 *
 * 主要导出：
 * - 当前文件以内部实现为主（无显式导出或仅默认匿名导出）
 *
 * 依赖关系：
 * - 上游依赖：`ali-oss`、`fs`、`path`、`https`
 * - 下游影响：供本地命令与 CI 调用
 */

import OSS from 'ali-oss';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
    API_URL: 'https://valorant-api.com/v1/playercards?language=zh-CN',

    OSS_BUCKET: process.env.OSS_BUCKET || 'valcards',
    OSS_REGION: process.env.OSS_REGION || 'oss-cn-guangzhou',
    OSS_PATH_PREFIX: 'playercards/',

    OUTPUT_JSON_PATH: path.join(__dirname, '../public/data/playercards_cn.json'),
    TEMP_DIR: path.join(__dirname, '../temp_playercards'),

    CONCURRENCY: 5, // 说明：最大并发下载/上传数。
    DOWNLOAD_TIMEOUT: 30000, // 说明：30 秒超时。
};

function createOSSClient() {
    const accessKeyId = process.env.OSS_ACCESS_KEY_ID;
    const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET;

    if (!accessKeyId || !accessKeySecret) {
        console.error('❌ 缺少 OSS 凭证，请设置环境变量:');
        console.error('   OSS_ACCESS_KEY_ID');
        console.error('   OSS_ACCESS_KEY_SECRET');
        process.exit(1);
    }

    return new OSS({
        region: CONFIG.OSS_REGION,
        accessKeyId,
        accessKeySecret,
        bucket: CONFIG.OSS_BUCKET,
    });
}


function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        const request = https.get(url, { timeout: CONFIG.DOWNLOAD_TIMEOUT }, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        });

        request.on('error', reject);
        request.on('timeout', () => {
            request.destroy();
            reject(new Error('Download timeout'));
        });
    });
}

async function runConcurrent(tasks, concurrency) {
    const results = [];
    const executing = new Set();

    for (const task of tasks) {
        const promise = task().then(result => {
            executing.delete(promise);
            return result;
        });
        executing.add(promise);
        results.push(promise);

        if (executing.size >= concurrency) {
            await Promise.race(executing);
        }
    }

    return Promise.allSettled(results);
}

const usedNames = new Set();

function getOSSKey(name, uuid) {
    let safeName = name.replace(/[<>:"/\\|?*]/g, '').trim();

    if (!safeName) safeName = uuid;

    if (usedNames.has(safeName)) {
        safeName = `${safeName}_${uuid.substring(0, 8)}`;
    }

    usedNames.add(safeName);
    return `${CONFIG.OSS_PATH_PREFIX}${safeName}.png`;
}

function getPublicUrl(key) {
    const encodedKey = key.split('/').map(encodeURIComponent).join('/');
    return `https://${CONFIG.OSS_BUCKET}.${CONFIG.OSS_REGION}.aliyuncs.com/${encodedKey}`;
}


async function main() {
    console.log('🚀 开始 Player Card OSS 迁移任务 (使用中文文件名)\n');

    console.log('📥 正在从 Valorant API 获取卡面列表...');
    const response = await fetch(CONFIG.API_URL);
    const { data: allCards } = await response.json();
    console.log(`   找到 ${allCards.length} 张卡面\n`);

    const cards = allCards.filter(card => !card.isHiddenIfNotOwned);
    console.log(`   过滤后保留 ${cards.length} 张公开卡面\n`);

    if (!fs.existsSync(CONFIG.TEMP_DIR)) {
        fs.mkdirSync(CONFIG.TEMP_DIR, { recursive: true });
    }

    const ossClient = createOSSClient();
    console.log(`🔗 OSS 配置: ${CONFIG.OSS_BUCKET} @ ${CONFIG.OSS_REGION}\n`);

    console.log('📤 开始下载并上传卡面...\n');

    const results = [];
    let processed = 0;

    const tasks = cards.map(card => async () => {
        const uuid = card.uuid;
        const name = card.displayName;
        const localPath = path.join(CONFIG.TEMP_DIR, `${uuid}.png`);
        const ossKey = getOSSKey(name, uuid);

        try {
            await downloadFile(card.displayIcon, localPath);

            await ossClient.put(ossKey, localPath);

            fs.unlinkSync(localPath);

            processed++;
            if (processed % 50 === 0) {
                console.log(`   已处理 ${processed}/${cards.length}...`);
            }

            return {
                uuid,
                name: card.displayName,
                url: getPublicUrl(ossKey),
            };
        } catch (error) {
            console.error(`   ⚠️ 处理 ${name} (${uuid}) 失败: ${error.message}`);
            return null;
        }
    });

    const settledResults = await runConcurrent(tasks, CONFIG.CONCURRENCY);

    const successfulCards = settledResults
        .filter(r => r.status === 'fulfilled' && r.value)
        .map(r => r.value);

    console.log(`\n✅ 成功上传 ${successfulCards.length}/${cards.length} 张卡面\n`);

    console.log('📝 生成 playercards_cn.json...');

    const outputDir = path.dirname(CONFIG.OUTPUT_JSON_PATH);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
        CONFIG.OUTPUT_JSON_PATH,
        JSON.stringify(successfulCards, null, 2),
        'utf-8'
    );

    console.log(`   已保存到: ${CONFIG.OUTPUT_JSON_PATH}`);
    console.log(`   共 ${successfulCards.length} 条记录\n`);

    if (fs.existsSync(CONFIG.TEMP_DIR)) {
        fs.rmSync(CONFIG.TEMP_DIR, { recursive: true, force: true });
    }

    console.log('🎉 任务完成！\n');
}

main().catch(err => {
    console.error('❌ 发生错误:', err);
    process.exit(1);
});
