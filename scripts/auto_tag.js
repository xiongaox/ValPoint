import { execSync } from 'child_process';
// import fs from 'fs'; // Not used

// 颜色代码
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function runCommand(command, ignoreError = false) {
    try {
        return execSync(command, { encoding: 'utf8', stdio: 'pipe' }).trim();
    } catch (error) {
        if (!ignoreError) {
            // console.error(`Command failed: ${command}`, error.message);
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

function main() {
    const args = process.argv.slice(2);
    const runMode = args.includes('--run');

    console.log(`${colors.blue}======================================${colors.reset}`);
    console.log(`${colors.blue}        自动发版脚本 (Node.js)${colors.reset}`);
    console.log(`${colors.blue}======================================${colors.reset}\n`);

    const latestTag = getLatestTag();
    console.log(`当前最新版本: ${colors.green}${latestTag}${colors.reset}\n`);

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
            console.log(`${colors.blue}正在推送标签...${colors.reset}`);
            try {
                // 使用 spawn 或 execSync 推送，直接继承 stdio 以便用户看到 git 的输出（如输入密码提示）
                execSync(`git push origin ${tagsToPush.join(' ')}`, { stdio: 'inherit' });
                console.log(`${colors.green}标签推送成功！${colors.reset}`);
            } catch (e) {
                console.error(`${colors.red}推送失败。${colors.reset}`);
                process.exit(1);
            }
        }
    } else {
        console.log(`${colors.yellow}预览模式 - 未创建标签${colors.reset}`);
        console.log(`请运行 ${colors.green}npm run release${colors.reset} 以创建并推送标签`);
    }
}

main();
