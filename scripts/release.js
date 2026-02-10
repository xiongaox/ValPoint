#!/usr/bin/env node

/**
 * ValPoint 版本发布脚本
 * 用途：自动创建 git tag 并推送，触发 GitHub Actions 构建多平台 Docker 镜像
 * 用法：
 *   node scripts/release.js          → 交互式选择版本号
 *   node scripts/release.js 1.2.3    → 直接指定版本号
 *   npm run release                  → 通过 npm script 调用
 */

import { execSync } from 'child_process';
import { createInterface } from 'readline';

// 颜色工具
const c = {
    green: (s) => `\x1b[32m${s}\x1b[0m`,
    yellow: (s) => `\x1b[33m${s}\x1b[0m`,
    cyan: (s) => `\x1b[36m${s}\x1b[0m`,
    red: (s) => `\x1b[31m${s}\x1b[0m`,
    dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

/** 执行命令并返回 stdout（静默 stderr） */
function run(cmd) {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

/** 检查命令是否执行成功 */
function tryRun(cmd) {
    try {
        run(cmd);
        return true;
    } catch {
        return false;
    }
}

/** 交互式输入 */
function prompt(question) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

/**
 * 从 git tags 中获取最新的语义化版本号
 * 按版本号排序，取最大值
 */
function getLatestTag() {
    try {
        // 获取所有 v* 格式的 tag，按版本号降序排列
        const tags = run('git tag -l "v*" --sort=-v:refname');
        if (!tags) return null;

        // 取第一个（最新的）
        const latest = tags.split('\n')[0];
        // 验证格式：v数字.数字.数字
        if (/^v\d+\.\d+\.\d+$/.test(latest)) {
            return latest.slice(1); // 去掉 'v' 前缀
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * 递增补丁版本号：1.0.0 → 1.0.1
 */
function incrementPatch(version) {
    const parts = version.split('.').map(Number);
    parts[2] += 1;
    return parts.join('.');
}

async function main() {
    console.log(c.cyan('================================'));
    console.log(c.cyan('   ValPoint 版本发布工具        '));
    console.log(c.cyan('================================'));

    // 1. 确定版本号
    let version;

    if (process.argv[2]) {
        // 命令行直接指定版本号
        version = process.argv[2];
    } else {
        // 交互式：从 git tag 获取最新版本并自动递增
        const latestVersion = getLatestTag();

        if (latestVersion) {
            const nextVersion = incrementPatch(latestVersion);
            console.log(`\n📌 当前最新标签：${c.yellow(`v${latestVersion}`)}`);
            console.log(`📦 建议下一版本：${c.green(`v${nextVersion}`)}`);
            const input = await prompt(`\n请输入版本号 ${c.dim(`(回车默认 ${nextVersion})`)}: `);
            version = input || nextVersion;
        } else {
            console.log(c.yellow('\n⚠️  未找到已有版本标签'));
            const input = await prompt('请输入版本号 (例如 1.0.0): ');
            if (!input) {
                console.error(c.red('❌ 错误：必须指定版本号'));
                process.exit(1);
            }
            version = input;
        }
    }

    // 去掉可能手动输入的 'v' 前缀
    version = version.replace(/^v/, '');
    const tag = `v${version}`;

    // 2. 校验版本号格式
    if (!/^\d+\.\d+\.\d+$/.test(version)) {
        console.error(c.red(`❌ 错误：版本号格式不正确 "${version}"，应为 x.y.z`));
        process.exit(1);
    }

    // 3. 检查 tag 是否已存在
    if (tryRun(`git rev-parse ${tag}`)) {
        console.error(c.red(`❌ 错误：标签 ${tag} 已存在`));
        console.log(`💡 提示：可以先删除旧标签：${c.yellow(`git tag -d ${tag} && git push origin :refs/tags/${tag}`)}`);
        process.exit(1);
    }

    // 4. 检查工作区状态
    const status = run('git status --porcelain');
    if (status) {
        console.log(c.yellow('\n⚠️  工作区有未提交的更改：'));
        console.log(status);
        const input = await prompt('\n是否继续发布？(y/n): ');
        if (input.toLowerCase() !== 'y') {
            console.log(c.yellow('已取消'));
            process.exit(0);
        }
    }

    // 5. 显示发布信息
    const branch = run('git branch --show-current');
    const lastCommit = run('git log --oneline -1');

    console.log(`\n${c.green(`📦 发布版本：${tag}`)}`);
    console.log(`📌 当前分支：${branch}`);
    console.log(`📝 最新提交：${lastCommit}\n`);

    const confirm = await prompt('确认创建标签并推送？(y/n): ');
    if (confirm.toLowerCase() !== 'y') {
        console.log(c.yellow('已取消'));
        process.exit(0);
    }

    // 6. 创建并推送 tag
    console.log(c.cyan(`\n[1/2] 正在创建标签 ${tag}...`));
    run(`git tag -a "${tag}" -m "Release ${tag}"`);

    console.log(c.cyan('[2/2] 正在推送标签到远程仓库...'));
    run(`git push origin "${tag}"`);

    console.log(c.green('\n✅ 发布成功！'));
    console.log(`🏷️  标签：${tag}`);
    console.log('🔄 GitHub Actions 将自动构建多平台 Docker 镜像');
    console.log(c.yellow('👀 查看构建状态：https://github.com/xiongaox/ValPoint/actions'));
}

main().catch((err) => {
    console.error(c.red(`❌ 发布失败：${err.message}`));
    process.exit(1);
});
