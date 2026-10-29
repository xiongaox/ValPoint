/**
 * avatarUtils - 头像工具
 *
 * 职责：
 * - 提供头像工具相关的纯函数工具。
 * - 封装常用转换或格式化逻辑。
 * - 降低重复代码并提升可复用性。
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

export const getAvatarByEmail = (email: string): string => {
    return getPlayerCardAvatarByEmail(email);
};

export { preloadPlayerCards };
