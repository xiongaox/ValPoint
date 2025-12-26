/**
 * fetchAbilities.cjs - 从腾讯 Valorant 官网爬取特工技能数据
 * 
 * 功能说明：
 * - 通过 GraphQL API 获取所有特工列表及其技能信息
 * - 提取每个技能的中文名称和图标 URL
 * - 将数据保存到 src/data/ability_overrides.json
 * 
 * 使用方法：node scripts/fetchAbilities.cjs
 * 输出文件：src/data/ability_overrides.json
 * 
 * 注意：此脚本为一次性工具脚本，仅在需要更新特工数据时运行
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ==================== API 配置 ====================
// 腾讯 Valorant 官网 GraphQL API 基础地址
const linkPre = 'https://api.val.qq.com/';

// 获取所有特工列表的 API（返回 id, name, e_name, icon）
const AGENT_LIST_URL =
  `${linkPre}go/agame/graphql/graphiQL?query=%7B%0A%20%20agents%20%7B%0A%20%20%20%20id%0A%20%20%20%20name%0A%20%20%20%20e_name%0A%20%20%20%20icon%0A%20%20%7D%0A%7D%0A`;

/**
 * 构建获取单个特工详情的 API URL
 * @param {number} id - 特工 ID
 * @returns {string} - GraphQL 查询 URL
 */
const agentDetailQuery = (id) =>
  `${linkPre}go/agame/graphql/graphiQL?query=%7B%0A%20%20agent(id%3A${id})%7B%0A%20%20%20%20name%0A%20%20%20%20e_name%0A%20%20%20%20skill%20%7B%0A%20%20%20%20%20%20name%0A%20%20%20%20%20%20icon%0A%20%20%20%20%20%20keypad%0A%20%20%20%20%20%20desc%0A%20%20%20%20%20%20type%0A%20%20%20%20%20%20type_name%0A%20%20%20%20%20%20video%7B%0A%20%20%20%20%20%20%20%20vid%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D`;

// ==================== 常量定义 ====================
/**
 * 技能按键到技能槽位的映射关系
 * - C 键 → Ability1（技能1，通常为购买技能）
 * - Q 键 → Ability2（技能2，通常为签名技能）
 * - E 键 → Grenade（技能3，通常为免费技能）
 * - X 键 → Ultimate（大招）
 */
const slotMap = {
  C: 'Ability1',
  Q: 'Ability2',
  E: 'Grenade',
  X: 'Ultimate',
};

// ==================== 工具函数 ====================
/**
 * 发起 HTTPS GET 请求并返回 JSON 数据
 * @param {string} url - 请求地址
 * @returns {Promise<object>} - 解析后的 JSON 对象
 */
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    // 设置请求头，模拟浏览器访问（防止被拦截）
    const options = {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117 Safari/537.36',
        Referer: 'https://val.qq.com/',
      },
    };
    https
      .get(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', reject);
  });
}

// ==================== 主函数 ====================
async function main() {
  // 第一步：获取所有特工列表
  console.log('正在获取特工列表...');
  const listRes = await fetchJson(AGENT_LIST_URL);
  const agents = listRes?.data?.agents || [];
  console.log(`共找到 ${agents.length} 个特工。`);

  // 存储最终结果的对象
  const result = {};

  // 第二步：遍历每个特工，获取其技能详情
  for (const agent of agents) {
    const id = agent.id;
    const displayName = agent.name;   // 中文名
    const enName = agent.e_name;       // 英文名
    if (!id) continue;

    console.log(`正在获取特工 ${displayName} (${enName}) 的技能信息...`);
    const detailRes = await fetchJson(agentDetailQuery(id));
    const detail = detailRes?.data?.agent;
    const skills = detail?.skill || [];

    // 解析技能图标和名称
    const icons = {};
    const titles = {};
    for (const sk of skills) {
      const slot = slotMap[sk.keypad] || null;
      if (!slot) continue;
      icons[slot] = sk.icon || null;    // 技能图标 URL
      titles[slot] = sk.name || slot;   // 技能中文名称
    }

    // 如果有有效的技能数据，添加到结果中
    if (Object.keys(icons).length) {
      // 同时用中文名和英文名作为 key，方便查找
      result[displayName] = { iconUrl: icons, titles };
      if (enName) {
        result[enName] = { iconUrl: icons, titles };
      }
    }
  }

  // 第三步：保存结果到 JSON 文件
  const outPath = path.join(__dirname, '..', 'src', 'data', 'ability_overrides.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`已保存 ${Object.keys(result).length} 条记录到 ${outPath}`);
}

// 执行主函数
main().catch((err) => {
  console.error('执行出错：', err);
  process.exit(1);
});

