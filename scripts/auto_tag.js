#!/usr/bin/env node
/**
 * auto_tag.js - ValPoint 自动发版脚本
 * 
 * 功能说明：
 *   1. 检查是否有未提交更改（有则终止）
 *   2. 检查是否有未推送的 commit -> 自动推送 (Auto upload to GitHub)
 *   3. 计算从上一个 tag 到现在的未标记 commit -> 生成新版本号
 *   4. 交互式询问：是否构建 Docker?
 *      - Yes: 正常 tag，推送到 GitHub 触发构建
 *      - No: tag 消息带 [skip docker]，推送到 GitHub 但 CI 跳过 Docker 构建
 * 
 * 使用方法：
 *   1. 交互模式 (推荐):
 *      npm run release
 *      (或 node scripts/auto_tag.js)
 * 
 *   2. 预览模式 (仅显示将要做的操作):
 *      npm run release:preview
 *      (或 node scripts/auto_tag.js --preview)
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
function runCommand(command, ignoreError = false, stdio = 'pipe') {
    try {
        const output = execSync(command, { encoding: 'utf8', stdio: stdio });
        return stdio === 'pipe' ? output.trim() : '';
    } catch (error) {
        if (!ignoreError) {
            console.error(`${colors.red}命令执行失败: ${command}${colors.reset}`);
            // 如果是严重错误，可以选择 process.exit(1); 但为了灵活性，这里仅打印
            if (stdio === 'inherit') process.exit(1);
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
    try {
        // 检查本地分支相对于远程跟踪分支是否有超前
        // 使用 stdio: ['pipe', 'pipe', 'ignore'] 来忽略 stderr，代替 2>/dev/null
        const unpushed = execSync('git log @{u}..HEAD --oneline', {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore']
        }).trim();
        return unpushed.length > 0;
    } catch (e) {
        // 如果报错（例如没有设置 upstream），我们假设没有未推送的代码或者无法判断
        // 为了安全起见，如果不确定可以返回 false，或者根据需求提示用户
        // 这里为了简单，且之前逻辑是 quiet 的，我们返回 false (但此时可能无法自动 push)
        return false;
    }
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
 * 推送代码到 GitHub
 */
function pushCodeToGithub() {
    console.log(`${colors.cyan}检测到未推送的 commit，正在自动推送到 GitHub...${colors.reset}`);
    runCommand('git push', false, 'inherit');
    console.log(`${colors.green}✓ 代码推送成功${colors.reset}\n`);
}

/**
 * 主函数
 */
async function main() {
    const args = process.argv.slice(2);
    const isPreview = args.includes('--preview');

    console.log(`${colors.blue}======================================${colors.reset}`);
    console.log(`${colors.blue}        ValPoint 自动发版脚本${colors.reset}`);
    console.log(`${colors.blue}======================================${colors.reset}\n`);

    // 1. 检查未提交的更改 (本地脏状态)
    if (hasUncommittedChanges()) {
        console.log(`${colors.yellow}⚠ 检测到未提交的更改${colors.reset}`);
        console.log('请先提交所有更改后再运行发版脚本\n');
        return;
    }

    // 2. 自动推送未推送的 commit (Auto Upload Github)
    if (!isPreview) {
        if (hasUnpushedCommits()) {
            try {
                pushCodeToGithub();
            } catch (e) {
                console.error(`${colors.red}无法推送到 GitHub，请检查网络或权限。${colors.reset}`);
                return;
            }
        } else {
            console.log(`${colors.green}✓ 本地代码已同步至 GitHub${colors.reset}\n`);
        }
    } else {
        if (hasUnpushedCommits()) {
            console.log(`${colors.yellow}[预览] 有未推送的代码，正式运行时会自动推送。${colors.reset}\n`);
        }
    }

    // 3. 计算版本
    const latestTag = getLatestTag();
    console.log(`上次发布版本: ${colors.green}${latestTag}${colors.reset}\n`);

    let commitsOutput;
    if (latestTag === 'v0.0.0') {
        commitsOutput = runCommand('git log --oneline --reverse');
    } else {
        commitsOutput = runCommand(`git log --oneline --reverse "${latestTag}..HEAD"`);
    }

    if (!commitsOutput) {
        console.log(`${colors.yellow}没有检测到新提交，无需发版。${colors.reset}`);
        return;
    }

    const commits = commitsOutput.split('\n').filter(Boolean);
    let currentVersion = latestTag;
    const pendingTags = [];

    console.log('计划发布的版本:');
    console.log('--------------------------------------');
    for (const line of commits) {
        const spaceIndex = line.indexOf(' ');
        const hash = line.substring(0, spaceIndex);
        const msg = line.substring(spaceIndex + 1);

        currentVersion = incrementPatch(currentVersion);

        console.log(`${colors.yellow}${currentVersion}${colors.reset} <- ${hash} ${msg}`);

        pendingTags.push({
            version: currentVersion,
            hash: hash,
            message: msg
        });
    }
    console.log('--------------------------------------');
    console.log(`共计: ${colors.green}${pendingTags.length}${colors.reset} 个新版本\n`);

    if (isPreview) {
        console.log(`${colors.cyan}预览结束。运行 npm run release 开始正式发版。${colors.reset}`);
        return;
    }

    // 4. 交互式询问 Docker 构建 (Interactive Docker Question)
    console.log(`${colors.blue}发布配置:${colors.reset}`);
    const answer = await askQuestion('是否构建并发布 Docker 镜像? (Y/n): ');

    const buildDocker = (answer === '' || answer === 'y' || answer === 'yes');

    if (buildDocker) {
        console.log(`${colors.green}>> 选择: 构建 Docker (CI 将执行构建)${colors.reset}\n`);
    } else {
        console.log(`${colors.yellow}>> 选择: 跳过 Docker (CI 将跳过构建)${colors.reset}\n`);
    }

    // 再次确认
    const confirm = await askQuestion('确认开始打标签并发布? (Y/n): ');
    if (confirm !== '' && confirm !== 'y' && confirm !== 'yes') {
        console.log('已取消。');
        return;
    }

    // 5. 打标签并推送
    console.log(`\n${colors.cyan}正在创建标签...${colors.reset}`);

    for (const tagInfo of pendingTags) {
        // 如果不构建 Docker，在 tag 消息中加入 [skip docker]
        // 注意：这依赖于 GitHub Actions 的 workflow 配置检测 commit message 或 tag message
        // 通常 CI 检测的是 commit message。但如果是 tag 触发的 workflow，
        // 我们可以在 tag message 中包含关键字，然后在 workflow 中读取 tag message 进行判断。
        // 或者，更简单的方法：
        // 我们的 workflow 目前可能是监听 push tags。
        // 我们这里将 [skip docker] 写入 tag 的附注信息 (Annotation Message)。

        let tagMessage = `Release ${tagInfo.version}`;
        if (!buildDocker) {
            tagMessage += ` [skip docker]`;
        }

        try {
            runCommand(`git tag -a "${tagInfo.version}" -m "${tagMessage}" "${tagInfo.hash}"`, true);
            console.log(`已创建: ${tagInfo.version}`);
        } catch (e) {
            console.error(`创建标签 ${tagInfo.version} 失败`);
        }
    }

    console.log(`\n${colors.cyan}正在推送标签到 GitHub...${colors.reset}`);
    try {
        // 推送所有 tag
        runCommand(`git push origin --tags`, false, 'inherit');
        console.log(`\n${colors.green}✓ 发版成功！${colors.reset}`);
        if (buildDocker) {
            console.log(`GitHub Actions 应该已开始构建 Docker 镜像。`);
        } else {
            console.log(`已请求跳过 Docker 构建。`);
        }
        console.log(`查看状态: https://github.com/xiongaox/ValPoint/actions`);
    } catch (e) {
        console.error(`${colors.red}✗ 推送标签失败${colors.reset}`);
    }
}

main().catch(console.error);
