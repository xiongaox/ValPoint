#!/usr/bin/env node
/**
 * auto_tag - autotag
 *
 * 职责：
 * - 执行autotag相关的自动化任务。
 * - 处理输入输出与日志提示。
 * - 支持批处理或发布/同步流程。
 */

import { execSync } from 'child_process';
import readline from 'readline';

const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

function runCommand(command, ignoreError = false, stdio = 'pipe') {
    try {
        const output = execSync(command, { encoding: 'utf8', stdio: stdio });
        return stdio === 'pipe' ? output.trim() : '';
    } catch (error) {
        if (!ignoreError) {
            console.error(`${colors.red}命令执行失败: ${command}${colors.reset}`);
            if (stdio === 'inherit') process.exit(1);
        }
        return '';
    }
}

function getLatestTag() {
    const tag = runCommand('git describe --tags --abbrev=0', true);
    return tag || 'v0.0.0';
}

function incrementPatch(version) {
    const parts = version.replace(/^v/, '').split('.').map(Number);
    if (parts.length !== 3) return 'v0.0.1';
    parts[2] += 1;
    return `v${parts.join('.')}`;
}

function hasUncommittedChanges() {
    const status = runCommand('git status --porcelain');
    return status.length > 0;
}

function hasUnpushedCommits() {
    try {
        const unpushed = execSync('git log @{u}..HEAD --oneline', {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore']
        }).trim();
        return unpushed.length > 0;
    } catch (e) {
        return false;
    }
}

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

function pushCodeToGithub() {
    console.log(`${colors.cyan}检测到未推送的 commit，正在自动推送到 GitHub...${colors.reset}`);
    runCommand('git push', false, 'inherit');
    console.log(`${colors.green}✓ 代码推送成功${colors.reset}\n`);
}

async function main() {
    const args = process.argv.slice(2);
    const isPreview = args.includes('--preview');

    console.log(`${colors.blue}======================================${colors.reset}`);
    console.log(`${colors.blue}        ValPoint 自动发版脚本${colors.reset}`);
    console.log(`${colors.blue}======================================${colors.reset}\n`);

    if (hasUncommittedChanges()) {
        console.log(`${colors.yellow}⚠ 检测到未提交的更改${colors.reset}`);
        console.log('请先提交所有更改后再运行发版脚本\n');
        return;
    }

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
    const commitCount = commits.length;
    let newVersion = incrementPatch(latestTag);

    // 获取最新的 commit 信息
    const latestCommit = commits[commits.length - 1];
    const spaceIndex = latestCommit.indexOf(' ');
    const latestHash = latestCommit.substring(0, spaceIndex);
    const latestMsg = latestCommit.substring(spaceIndex + 1);

    console.log('计划发布的版本:');
    console.log('--------------------------------------');
    if (commitCount > 1) {
        console.log(`${colors.cyan}(跳过 ${commitCount - 1} 个中间 commit)${colors.reset}`);
    }
    console.log(`${colors.yellow}${newVersion}${colors.reset} <- HEAD (${latestHash}) ${latestMsg}`);
    console.log('--------------------------------------\n');

    const customVersion = await askQuestion(`确认发布版本 ${newVersion}? (直接回车保持，或输入新版本号如 v2.2.0): `);
    if (customVersion) {
        newVersion = customVersion;
        console.log(`${colors.green}>> 已切换至版本: ${newVersion}${colors.reset}\n`);
    }

    if (isPreview) {
        console.log(`${colors.cyan}预览结束。运行 npm run release 开始正式发版。${colors.reset}`);
        return;
    }

    console.log(`${colors.blue}发布配置:${colors.reset}`);
    const answer = await askQuestion('是否构建并发布 Docker 镜像? (Y/n): ');

    const buildDocker = (answer === '' || answer === 'y' || answer === 'yes');

    if (buildDocker) {
        console.log(`${colors.green}>> 选择: 构建 Docker (将在本地通过 OrbStack 构建推送到 Docker Hub)${colors.reset}\n`);
    } else {
        console.log(`${colors.yellow}>> 选择: 跳过 Docker 构建${colors.reset}\n`);
    }

    const confirm = await askQuestion('确认开始打标签并发布? (Y/n): ');
    if (confirm !== '' && confirm !== 'y' && confirm !== 'yes') {
        console.log('已取消。');
        return;
    }

    console.log(`\n${colors.cyan}正在创建标签...${colors.reset}`);

    // 本地构建需要先打 tag，但如果是先构建再 push，我们可以只打 tag 不 push，或者等待构建完成后统一 push。
    // 为了流程稳健，我们先尝试构建 Docker（如果选中），构建成功后再 push git tag。

    if (buildDocker) {
        console.log(`\n${colors.cyan}开始构建 Docker 镜像 (版本: ${newVersion})...${colors.reset}`);
        try {
            // 调用本地脚本，传入版本号
            runCommand(`./scripts/build-multi-arch.sh ${newVersion}`, false, 'inherit');
            console.log(`${colors.green}✓ Docker 镜像构建并推送成功！${colors.reset}\n`);
        } catch (e) {
            console.error(`${colors.red}Docker 构建失败，终止由于步骤。${colors.reset}`);
            return;
        }
    }

    // Git Tag 逻辑
    let tagMessage = latestMsg;
    // 既然本地构建了，CI 就不需要构建了，总是加上 skip docker 防止 GitHub Actions 重复构建
    if (buildDocker) {
        tagMessage += ` [skip docker] (built locally)`;
    } else {
        tagMessage += ` [skip docker]`;
    }

    try {
        // 直接在 HEAD 上打标签
        runCommand(`git tag -a "${newVersion}" -m "${tagMessage}"`, true);
        console.log(`已创建 Git 标签: ${newVersion}`);
    } catch (e) {
        console.error(`创建标签 ${newVersion} 失败`);
        return;
    }

    console.log(`\n${colors.cyan}正在推送标签到 GitHub...${colors.reset}`);
    try {
        runCommand(`git push origin "${newVersion}"`, false, 'inherit');
        console.log(`\n${colors.green}✓ 发版成功！${colors.reset}`);
        console.log(`版本 ${newVersion} 已发布。`);
    } catch (e) {
        console.error(`${colors.red}✗ 推送标签失败${colors.reset}`);
    }
}

main().catch(console.error);
