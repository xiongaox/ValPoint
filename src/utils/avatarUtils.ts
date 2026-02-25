/**
 * avatarUtils - 工具层
 *
 * 模块定位：
 * - 所在层级：工具层
 * - 主要目标：提供无状态工具函数
 *
 * 关键职责：
 * - 提供轻量且可复用的纯工具方法
 * - 避免重复实现常见转换/解析逻辑
 * - 维持调用方代码简洁
 *
 * 主要导出：
 * - `AGENT_AVATARS`、`getRandomAvatar`、`getAvatarByUserId`、`getAvatarByEmail`
 *
 * 依赖关系：
 * - 上游依赖：无显式外部模块依赖
 * - 下游影响：供 hooks/components/services 复用
 */

import {
    getPlayerCardByEmail as getPlayerCardAvatarByEmail,
    getDefaultPlayerCardAvatar,
    preloadPlayerCards
} from './playerCardAvatars';

export const AGENT_AVATARS = [
    'KO.png', '不死鸟.png', '壹决.png', '夜露.png', '奇乐.png',
    '尚勃勒.png', '幻棱.png', '幽影.png', '捷风.png', '斯凯.png',
    '星礈.png', '暮蝶.png', '海神.png', '炼狱.png', '猎枭.png',
    '盖可.png', '禁灭.png', '维斯.png', '芮娜.png', '蝰蛇.png',
    '贤者.png', '钛狐.png', '钢锁.png', '铁臂.png', '零.png',
    '雷兹.png', '霓虹.png', '黑梦.png'
];

export const getRandomAvatar = (): string => {
    return getDefaultPlayerCardAvatar();
};

export const getAvatarByUserId = (userId: string): string => {
    return getPlayerCardAvatarByEmail(userId);
};

export const getAvatarByEmail = (email: string): string => {
    return getPlayerCardAvatarByEmail(email);
};

export { preloadPlayerCards };
