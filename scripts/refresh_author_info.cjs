/**
 * 批量刷新作者信息脚本
 * 
 * 用途：修复 author_name 为空或"未提取到"的记录
 * 优先复用 valorant_lineups 中同 source_id 的作者信息，取不到才调用 Edge Function
 * 
 * 使用方法：
 * 1. 确保 .env 文件中配置了 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY
 * 2. 在项目根目录运行：node scripts/refresh_author_info.cjs
 * 
 * 参数：
 * --table <name>  指定要更新的表，默认 valorant_shared
 * --limit <n>     限制处理数量，默认 100
 * --delay <ms>    每次请求间隔（毫秒），默认 2000
 * --dry-run       只检查不更新
 * 
 * 示例：
 * node scripts/refresh_author_info.cjs --limit 50 --delay 3000
 * node scripts/refresh_author_info.cjs --table valorant_lineups --dry-run
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// 手动加载 .env 文件
function loadEnv() {
    const envPath = path.resolve(__dirname, '../.env');
    if (!fs.existsSync(envPath)) {
        console.error('[ERROR] 找不到 .env 文件');
        process.exit(1);
    }

    const content = fs.readFileSync(envPath, 'utf-8');
    const env = {};

    content.split('\n').forEach(line => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
            env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
        }
    });

    return env;
}

// 解析命令行参数
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        table: 'valorant_shared',
        limit: 100,
        delay: 2000,
        dryRun: false
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--table':
                options.table = args[++i];
                break;
            case '--limit':
                options.limit = parseInt(args[++i], 10);
                break;
            case '--delay':
                options.delay = parseInt(args[++i], 10);
                break;
            case '--dry-run':
                options.dryRun = true;
                break;
        }
    }

    return options;
}

// 延迟函数
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 日志输出
function log(message, type = 'info') {
    const timestamp = new Date().toISOString().slice(11, 19);
    const prefix = {
        info: '\x1b[36m[INFO]\x1b[0m',
        success: '\x1b[32m[SUCCESS]\x1b[0m',
        error: '\x1b[31m[ERROR]\x1b[0m',
        warn: '\x1b[33m[WARN]\x1b[0m'
    }[type] || '[INFO]';
    console.log(`${timestamp} ${prefix} ${message}`);
}

// HTTP 请求封装
function httpRequest(url, options, body) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const reqOptions = {
            hostname: urlObj.hostname,
            port: 443,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        const req = https.request(reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(typeof body === 'string' ? body : JSON.stringify(body));
        }

        req.end();
    });
}

// Supabase 查询
async function supabaseQuery(baseUrl, apiKey, table, query) {
    const url = `${baseUrl}/rest/v1/${table}?${query}`;
    return httpRequest(url, {
        method: 'GET',
        headers: {
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
    });
}

// Supabase 更新
async function supabaseUpdate(baseUrl, apiKey, table, id, data) {
    const url = `${baseUrl}/rest/v1/${table}?id=eq.${id}`;
    return httpRequest(url, {
        method: 'PATCH',
        headers: {
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        }
    }, data);
}

// 从个人库按 source_id 复用作者信息（共享库专用）
async function fetchAuthorFromPersonal(supabaseUrl, apiKey, sourceId) {
    if (!sourceId) return null;
    const query = `select=author_name,author_avatar,author_uid&id=eq.${sourceId}&limit=1`;
    const rows = await supabaseQuery(supabaseUrl, apiKey, 'valorant_lineups', query);
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const row = rows[0];
    if (!row.author_name || row.author_name === '未提取到') return null;
    return row;
}

// 调用 Edge Function
async function callEdgeFunction(baseUrl, apiKey, sourceLink) {
    const url = `${baseUrl}/functions/v1/get-video-author`;
    return httpRequest(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
    }, { url: sourceLink });
}

// 主函数
async function main() {
    const options = parseArgs();
    const env = loadEnv();

    log(`==========================================`);
    log(`批量刷新作者信息脚本`);
    log(`==========================================`);
    log(`表名: ${options.table}`);
    log(`限制: ${options.limit} 条`);
    log(`间隔: ${options.delay}ms`);
    log(`模式: ${options.dryRun ? '检查模式（不更新）' : '更新模式'}`);
    log(`==========================================`);

    const supabaseUrl = env.VITE_SUPABASE_URL;
    // 优先使用 Service Role Key（可访问所有表）
    const supabaseKey = env.VITE_SUPABASE_SERVICE_KEY || env.VITE_SUPABASE_ANON_KEY;
    const keyType = env.VITE_SUPABASE_SERVICE_KEY ? 'Service Role Key' : 'Anon Key';

    if (!supabaseUrl || !supabaseKey) {
        log('缺少 Supabase 配置，请检查 .env 文件', 'error');
        process.exit(1);
    }

    log(`使用密钥: ${keyType}`);

    if (options.table === 'valorant_lineups' && !env.VITE_SUPABASE_SERVICE_KEY) {
        log('警告: 访问个人库需要 Service Role Key，请在 .env 中添加 VITE_SUPABASE_SERVICE_KEY', 'warn');
    }

    if (options.table === 'valorant_shared' && !env.VITE_SUPABASE_SERVICE_KEY) {
        log('提示: 未配置 VITE_SUPABASE_SERVICE_KEY，读取个人库复用作者可能受 RLS 限制，将回退到 Edge Function', 'warn');
    }

    // 查询需要更新的记录
    log('正在查询需要更新的记录...');

    const selectCols = options.table === 'valorant_shared'
        ? 'id,title,source_link,source_id,author_name,author_avatar,author_uid'
        : 'id,title,source_link,author_name,author_avatar,author_uid';
    const query = `select=${selectCols}&or=(author_name.is.null,author_name.eq.,author_name.eq.未提取到)&source_link=not.is.null&source_link=neq.&limit=${options.limit}`;
    const records = await supabaseQuery(supabaseUrl, supabaseKey, options.table, query);

    if (!Array.isArray(records)) {
        log(`查询失败: ${JSON.stringify(records)}`, 'error');
        process.exit(1);
    }

    log(`找到 ${records.length} 条需要更新的记录`);

    if (records.length === 0) {
        log('没有需要更新的记录，退出', 'success');
        process.exit(0);
    }

    // 统计
    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;

    // 逐条处理
    for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const progress = `[${i + 1}/${records.length}]`;

        if (!record.source_link) {
            log(`${progress} 跳过: 无来源链接 - ${record.title || record.id}`, 'warn');
            skipCount++;
            continue;
        }

        // 检查链接格式
        if (!record.source_link.includes('douyin.com') &&
            !record.source_link.includes('bilibili.com') &&
            !record.source_link.includes('b23.tv')) {
            log(`${progress} 跳过: 不支持的链接 - ${record.title || record.id}`, 'warn');
            skipCount++;
            continue;
        }

        log(`${progress} 处理: ${record.title || record.id}`);

        // 优先复用个人库中同一 source_id 的作者信息，避免不必要的 Edge Function 请求
        let localAuthor = null;
        if (options.table === 'valorant_shared') {
            try {
                localAuthor = await fetchAuthorFromPersonal(supabaseUrl, supabaseKey, record.source_id || record.id);
            } catch (err) {
                log(`  读取个人库作者失败: ${err.message}`, 'warn');
            }
        }

        if (options.dryRun) {
            log(`  链接: ${record.source_link}`);
            log(localAuthor
                ? `  可复用个人库作者: ${localAuthor.author_name}`
                : `  个人库无作者，将调用 Edge Function`);
            continue;
        }

        if (localAuthor) {
            await supabaseUpdate(supabaseUrl, supabaseKey, options.table, record.id, {
                author_name: localAuthor.author_name,
                author_avatar: localAuthor.author_avatar || record.author_avatar,
                author_uid: localAuthor.author_uid || record.author_uid,
            });
            log(`  复用个人库作者: ${localAuthor.author_name}`, 'success');
            successCount++;
            if (i < records.length - 1) await sleep(Math.min(options.delay, 300));
            continue;
        }

        try {
            // 调用 Edge Function
            const result = await callEdgeFunction(supabaseUrl, supabaseKey, record.source_link);

            if (result.status === 'success' && result.data) {
                const authorData = result.data;

                if (authorData.username && authorData.username !== '未提取到') {
                    // 提取 uid
                    let uid = record.author_uid;
                    if (authorData.user_home_url) {
                        const uidMatch = authorData.user_home_url.match(/\/user\/([^\/]+)/);
                        if (uidMatch) uid = uidMatch[1];
                    }

                    // 更新数据库
                    await supabaseUpdate(supabaseUrl, supabaseKey, options.table, record.id, {
                        author_name: authorData.username,
                        author_avatar: authorData.avatar || record.author_avatar,
                        author_uid: uid
                    });

                    log(`  成功: ${authorData.username}`, 'success');
                    successCount++;
                } else {
                    log(`  未能提取用户名`, 'warn');
                    skipCount++;
                }
            } else {
                log(`  API 返回错误: ${result.error || '未知错误'}`, 'error');
                failCount++;
            }
        } catch (err) {
            log(`  请求失败: ${err.message}`, 'error');
            failCount++;
        }

        // 延迟
        if (i < records.length - 1) {
            await sleep(options.delay);
        }
    }

    // 输出统计
    log(`==========================================`);
    log(`处理完成！`);
    log(`成功: ${successCount} 条`);
    log(`失败: ${failCount} 条`);
    log(`跳过: ${skipCount} 条`);
    log(`==========================================`);
}

// 执行
main().catch(err => {
    log(`脚本执行出错: ${err.message}`, 'error');
    process.exit(1);
});
