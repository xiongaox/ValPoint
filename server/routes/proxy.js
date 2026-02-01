/**
 * 外部 API 代理路由
 * 
 * 职责：
 * - 代理 B站 API 请求
 * - 代理抖音页面抓取
 * - 绕过浏览器 CORS 限制
 */

import express from 'express';

const router = express.Router();

/**
 * 抖音 HTML 清洗函数
 */
function cleanHtml(text) {
    let decoded = text
        .replace(/\\u002F/g, "/")
        .replace(/\\u0026/g, "&")
        .replace(/\\"/g, '"')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/\\\//g, '/');
    try { decoded = decodeURIComponent(decoded); } catch (e) { }
    return decoded;
}

/**
 * POST /api/proxy/author - 获取作者信息
 * Body: { url: 'https://...' }
 */
router.post('/author', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: '缺少 URL 参数' });
        }

        const douyinRegex = /(https?:\/\/(?:v|www|m)\.douyin\.com\/[^\s"']+)/;
        const biliRegex = /(https?:\/\/(?:www|m)\.bilibili\.com\/video\/[^\s"']+)|(https?:\/\/b23\.tv\/[^\s"']+)/;

        const matchDouyin = url.match(douyinRegex);
        const matchBili = url.match(biliRegex);

        let result;

        if (matchDouyin) {
            result = await handleDouyin(matchDouyin[0]);
        } else if (matchBili) {
            let finalUrl = matchBili[0];
            if (finalUrl.includes("b23.tv")) {
                const r = await fetch(finalUrl, { redirect: 'follow' });
                finalUrl = r.url;
            }
            result = await handleBilibili(finalUrl);
        } else {
            return res.status(400).json({ error: '无效链接：未识别到抖音或B站链接' });
        }

        res.json({ status: 'success', data: result });
    } catch (error) {
        console.error('代理请求失败:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Bilibili 解析 - 使用官方 API
 */
async function handleBilibili(targetUrl) {
    const bvMatch = targetUrl.match(/(BV[a-zA-Z0-9]+)/);
    if (!bvMatch) throw new Error("未找到有效的 BV 号");

    const bvid = bvMatch[1];
    const apiUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://www.bilibili.com/"
    };

    const response = await fetch(apiUrl, { headers });
    const json = await response.json();

    if (json.code === 0 && json.data) {
        const owner = json.data.owner;
        return {
            username: owner.name,
            avatar: owner.face,
            user_home_url: `https://space.bilibili.com/${owner.mid}`,
            is_cover: false,
            source: "bilibili",
            cover_image: json.data.pic
        };
    } else {
        throw new Error(`B站 API 报错: ${json.message}`);
    }
}

/**
 * 抖音解析 - 抓取页面
 */
async function handleDouyin(targetUrl) {
    const headers = {
        "User-Agent": "Mozilla/5.0 (iPad; CPU OS 13_3 like Mac OS X)",
        "Referer": "https://www.douyin.com/"
    };

    const response = await fetch(targetUrl, { headers });
    const html = cleanHtml(await response.text());

    let nickname = "", avatar = "", sec_uid = "";

    // 提取用户主页 sec_uid
    const linkMatch = html.match(/href=["']\/\/www\.douyin\.com\/user\/(MS4wLjABAAAA[A-Za-z0-9_\\-]+)["']/);
    if (linkMatch) sec_uid = linkMatch[1];

    // 提取头像
    const avatarMatch = html.match(/"url_list":\["(https:\/\/[^"]*?aweme-avatar[^"]*?)"/);
    if (avatarMatch) avatar = avatarMatch[1];

    // 从 meta description 提取用户名
    const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
    if (descMatch) {
        const description = descMatch[1];
        const nickMatch = description.match(/ - (.*?)于\d+发布在抖音/);
        if (nickMatch) {
            nickname = nickMatch[1].trim();
        }
    }

    // 备用方法1: JSON数据中的nickname
    if (!nickname) {
        const nicknameMatch = html.match(/"nickname":"([^"]+)"/);
        if (nicknameMatch) nickname = nicknameMatch[1];
    }

    // 备用方法2: title标签
    if (!nickname) {
        const titleMatch = html.match(/<title>(.*?)[\s-]*抖音/);
        if (titleMatch) nickname = titleMatch[1].trim();
    }

    return {
        username: nickname || "未提取到",
        avatar: avatar || "",
        user_home_url: sec_uid ? `https://www.douyin.com/user/${sec_uid}` : "",
        is_cover: false,
        source: "douyin"
    };
}

export default router;
