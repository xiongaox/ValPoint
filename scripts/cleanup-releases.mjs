import https from 'https';
import readline from 'readline';

// 配置
const OWNER = 'xiongaox';
const REPO = 'ValPoint';

// 获取命令行参数中的 Token
const tokenArgIndex = process.argv.indexOf('--token');
const TOKEN = tokenArgIndex !== -1 ? process.argv[tokenArgIndex + 1] : process.env.GH_TOKEN;

if (!TOKEN) {
    console.error('错误: 请提供 GitHub Token。');
    console.error('用法: node scripts/cleanup-releases.mjs --token YOUR_GITHUB_TOKEN');
    process.exit(1);
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const request = (method, path) => {
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'api.github.com',
            path: path.startsWith('http') ? new URL(path).pathname + new URL(path).search : `/repos/${OWNER}/${REPO}${path}`,
            method: method,
            headers: {
                'User-Agent': 'Node.js-Script',
                'Authorization': `token ${TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                // Return headers for inspection if needed
                const result = {
                    status: res.statusCode,
                    headers: res.headers,
                    data: data ? JSON.parse(data) : null
                };

                if (method === 'GET' && path === '/user') { // Special case for checking identity
                    resolve(result);
                    return;
                }

                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(result.data);
                } else {
                    reject(new Error(`Request to ${path} failed with status ${res.statusCode}: ${data}`));
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
};

async function checkToken() {
    console.log('正在验证 Token 权限...');
    try {
        const result = await request('GET', '/user');
        console.log(`当前 Token 登录用户: ${result.data.login}`);

        const scopes = result.headers['x-oauth-scopes'];
        console.log(`Token 权限范围: ${scopes || '(无/未检测到)'}`);

        if (!scopes || !scopes.includes('repo')) {
            console.warn('警告: 检测到 Token 可能缺少 "repo" 权限，这可能导致删除失败！');
        } else {
            console.log('权限检查通过: 包含 "repo" 权限。');
        }

    } catch (e) {
        console.error('Token 验证失败:', e.message);
        process.exit(1);
    }
}

async function deleteRef(tag) {
    try {
        await request('DELETE', `/git/refs/tags/${tag}`);
        console.log(`[Tag] ${tag} 已删除`);
    } catch (e) {
        console.log(`[Tag] ${tag} 删除失败 (可能不存在或已删除)`);
    }
}

async function main() {
    try {
        await checkToken();

        console.log(`\n正在获取 ${OWNER}/${REPO} 的发行版列表...`);
        const releases = await request('GET', '/releases?per_page=100');

        if (releases.length === 0) {
            console.log('没有找到任何发行版。');
            process.exit(0);
        }

        console.log(`\n找到 ${releases.length} 个发行版:`);
        releases.forEach((r, i) => {
            console.log(`${i + 1}. ${r.tag_name} (ID: ${r.id}) - 创建于: ${r.created_at}`);
        });

        rl.question('\n请输入要保留的最新版本数量 (例如请输入 1 保留最新的一个，输入 0 删除所有): ', async (answer) => {
            const keepCount = parseInt(answer);

            if (isNaN(keepCount) || keepCount < 0) {
                console.error('无效的输入');
                process.exit(1);
            }

            const toDelete = releases.slice(keepCount);

            if (toDelete.length === 0) {
                console.log('没有需要删除的版本。');
                process.exit(0);
            }

            console.log(`\n准备删除以下 ${toDelete.length} 个版本:`);
            toDelete.forEach(r => console.log(`- ${r.tag_name}`));

            rl.question('\n确认删除吗？此操作不可恢复！(输入 "yes" 确认): ', async (confirm) => {
                if (confirm.toLowerCase() !== 'yes') {
                    console.log('已取消。');
                    process.exit(0);
                }

                for (const release of toDelete) {
                    process.stdout.write(`正在删除 Release: ${release.tag_name}... `);
                    try {
                        await request('DELETE', `/releases/${release.id}`);
                        console.log(`✅ 成功`);
                        await deleteRef(release.tag_name);
                    } catch (err) {
                        console.log(`❌ 失败`);
                        console.error(`   -> ${err.message}`);
                        if (err.message.includes('404')) {
                            console.error('   提示: 404 错误通常表示 Token 缺少 delete 权限，或者没有勾选 "repo" scope。');
                        }
                    }
                }

                console.log('\n清理完成！');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('发生错误:', error.message);
        process.exit(1);
    }
}

main();
