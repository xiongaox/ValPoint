#!/usr/bin/env node
/**
 * auto_tag.js - Git 自动发版脚本
 * 
 * 功能说明：
 *   自动为未打标签的 commit 递增版本号并创建 tag
 * 
 * 使用方法：
 *   1. 预览模式（不实际创建标签）：
 *      node scripts/auto_tag.js
 *      或 npm run release:preview
 * 
 *   2. 执行模式（创建标签，交互式询问是否推送触发 Docker 构建）：
 *      node scripts/auto_tag.js --run
 *      或 npm run release
 * 
 * 工作原理：
 *   1. 获取当前最新的 git tag（如 v2.1.5）
 *   2. 查找从该 tag 到 HEAD 的所有 commit
 *   3. 为每个 commit 依次递增补丁版本号（v2.1.6, v2.1.7, ...）
 *   4. 创建对应的 tag
 *   5. 询问是否推送 tag（推送会触发 GitHub Actions 构建 Docker）
 * 
 * 注意事项：
 *   - 执行前请确保所有代码已提交并推送
 *   - 推送 tag 会触发 GitHub Actions 自动构建 Docker 镜像
 */

import { execSync } from 'child_process';
import readline from 'readline';

// 终端颜色代码
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

/**
 * 执行 shell 命令
 */
function runCommand(command, ignoreError = false) {
    try {
        return execSync(command, { encoding: 'utf8', stdio: 'pipe' }).trim();
    } catch (error) {
        if (!ignoreError) {
            console.error(`${colors.red}命令执行失败: ${command}${colors.reset}`);
        }
        return '';
    }
}

/**
 * 获取当前最新的 tag
 */
function getLatestTag() {
    const tag = runCommand('git describe --tags --abbrev=0', true);
    return tag || 'v0.0.0';
}

/**
 * 递增补丁版本号
 */
function incrementPatch(version) {
    const parts = version.replace(/^v/, '').split('.').map(Number);
    if (parts.length !== 3) return 'v0.0.1';
    parts[2] += 1;
    return `v${parts.join('.')}`;
}

/**
 * 检查是否有未提交的更改
 */
function hasUncommittedChanges() {
    const status = runCommand('git status --porcelain');
    return status.length > 0;
}

/**
 * 检查是否有未推送的 commit
 */
function hasUnpushedCommits() {
    const unpushed = runCommand('git log @{u}..HEAD --oneline 2>/dev/null', true);
    return unpushed.length > 0;
}

/**
 * 交互式询问
 */
function askQuestion(question) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.toLowerCase().trim());
        });
    });
}

/**
 * 主函数
 */
async function main() {
    const args = process.argv.slice(2);
    const runMode = args.includes('--run');
    const autoPush = args.includes('-y') || args.includes('--yes');

    console.log(`${colors.blue}======================================${colors.reset}`);
    console.log(`${colors.blue}        ValPoint 自动发版脚本${colors.reset}`);
    console.log(`${colors.blue}======================================${colors.reset}\n`);

    // 检查未提交的更改
    if (hasUncommittedChanges()) {
        console.log(`${colors.yellow}⚠ 检测到未提交的更改${colors.reset}`);
        console.log('请先提交所有更改后再运行发版脚本\n');
        console.log('运行: git add . && git commit -m "your message"');
        return;
    }

    // 检查未推送的 commit
    if (hasUnpushedCommits() && runMode) {
        console.log(`${colors.yellow}⚠ 检测到未推送的 commit${colors.reset}`);
        let answer = 'n';
        if (autoPush) {
            console.log(`${colors.cyan}检测到 -y 参数，自动推送代码...${colors.reset}`);
            answer = 'y';
        } else {
            answer = await askQuestion('是否先推送代码? (y/n): ');
        }
        if (answer === 'y' || answer === 'yes') {
            console.log(`${colors.cyan}正在推送代码...${colors.reset}`);
            try {
                execSync('git push', { stdio: 'inherit' });
                console.log(`${colors.green}✓ 代码推送成功${colors.reset}\n`);
            } catch (e) {
                console.error(`${colors.red}✗ 推送失败${colors.reset}`);
                return;
            }
        }
    }

    // 获取最新 tag
    const latestTag = getLatestTag();
    console.log(`当前最新版本: ${colors.green}${latestTag}${colors.reset}\n`);

    // 获取未打 tag 的 commits
    let commitsOutput;
    if (latestTag === 'v0.0.0') {
        commitsOutput = runCommand('git log --oneline --reverse');
    } else {
        commitsOutput = runCommand(`git log --oneline --reverse "${latestTag}..HEAD"`);
    }

    if (!commitsOutput) {
        console.log(`${colors.yellow}没有检测到需要发版的提交${colors.reset}`);
        return;
    }

    const commits = commitsOutput.split('\n').filter(Boolean);
    let currentVersion = latestTag;
    const tagsToPush = [];
    let count = 0;

    console.log('即将打标签的提交:');
    console.log('--------------------------------------');

    for (const line of commits) {
        const spaceIndex = line.indexOf(' ');
        const hash = line.substring(0, spaceIndex);
        const msg = line.substring(spaceIndex + 1);

        currentVersion = incrementPatch(currentVersion);
        count++;

        console.log(`${colors.yellow}${currentVersion}${colors.reset} <- ${hash} ${msg}`);

        if (runMode) {
            runCommand(`git tag "${currentVersion}" "${hash}"`);
            tagsToPush.push(currentVersion);
        }
    }

    console.log('--------------------------------------');
    console.log(`总计: ${colors.green}${count}${colors.reset} 个提交\n`);

    if (runMode) {
        if (tagsToPush.length > 0) {
            console.log(`${colors.green}✓ 已创建 ${tagsToPush.length} 个本地标签${colors.reset}\n`);

            // 询问是否推送 tag（触发 Docker 构建）
            console.log(`${colors.cyan}推送标签将触发 GitHub Actions 构建 Docker 镜像${colors.reset}`);

            let answer = 'n';
            if (autoPush) {
                console.log(`${colors.cyan}检测到 -y 参数，自动推送标签...${colors.reset}`);
                answer = 'y';
            } else {
                answer = await askQuestion('是否推送标签并构建 Docker? (y/n): ');
            }

            if (answer === 'y' || answer === 'yes') {
                console.log(`\n${colors.blue}正在推送标签...${colors.reset}`);
                try {
                    execSync(`git push origin ${tagsToPush.join(' ')}`, { stdio: 'inherit' });
                    console.log(`\n${colors.green}✓ 标签推送成功！Docker 构建已触发${colors.reset}`);
                    console.log(`查看构建状态: https://github.com/xiongaox/ValPoint/actions`);
                } catch (e) {
                    console.error(`${colors.red}✗ 推送失败${colors.reset}`);
                    process.exit(1);
                }
            } else {
                console.log(`\n${colors.yellow}已跳过推送，标签仅保留在本地${colors.reset}`);
                console.log(`稍后手动推送: git push origin ${tagsToPush[tagsToPush.length - 1]}`);
            }
        }
    } else {
        console.log(`${colors.yellow}预览模式 - 未创建标签${colors.reset}`);
        console.log(`请运行 ${colors.green}npm run release${colors.reset} 或 ${colors.green}node scripts/auto_tag.js --run${colors.reset} 以创建标签`);
    }
}

main().catch(console.error);
