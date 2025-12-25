/**
 * avatarUtils.ts - 用户头像工具函数
 * 
 * 职责：
 * - 提供可用特工头像列表
 * - 生成随机默认头像（用于新注册用户）
 */

// 预定义的特工头像列表 (public/agents 下的文件名)
export const AGENT_AVATARS = [
    'KO.png', '不死鸟.png', '壹决.png', '夜露.png', '奇乐.png',
    '尚勃勒.png', '幻棱.png', '幽影.png', '捷风.png', '斯凯.png',
    '星礈.png', '暮蝶.png', '海神.png', '炼狱.png', '猎枭.png',
    '盖可.png', '禁灭.png', '维斯.png', '芮娜.png', '蝰蛇.png',
    '贤者.png', '钛狐.png', '钢锁.png', '铁臂.png', '零.png',
    '雷兹.png', '霓虹.png', '黑梦.png'
];

/**
 * 获取随机默认头像
 */
export const getRandomAvatar = (): string => {
    const index = Math.floor(Math.random() * AGENT_AVATARS.length);
    return AGENT_AVATARS[index];
};

/**
 * 根据用户 ID 生成确定性随机头像（同一 ID 始终返回相同头像）
 */
export const getAvatarByUserId = (userId: string): string => {
    // 使用简单的哈希算法，确保同一用户始终获得相同头像
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = ((hash << 5) - hash) + userId.charCodeAt(i);
        hash = hash & hash; // Convert to 32-bit integer
    }
    const index = Math.abs(hash) % AGENT_AVATARS.length;
    return AGENT_AVATARS[index];
};

/**
 * 根据用户邮箱生成确定性随机头像（同一邮箱始终返回相同头像）
 */
export const getAvatarByEmail = (email: string): string => {
    return getAvatarByUserId((email || '').toLowerCase()); // 复用同一哈希逻辑，确保大小写不敏感
};
