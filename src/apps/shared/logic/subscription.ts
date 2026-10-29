/**
 * subscription - 共享库subscription
 *
 * 职责：
 * - 承载共享库subscription的核心业务逻辑。
 * - 组合数据处理与决策流程。
 * - 与上层 UI 或服务模块对接。
 */

import { supabaseUrl, supabaseAnonKey } from '../../../supabaseClient';

export interface Subscription {
    id: string; // 说明：UUID 或生成的 ID。
    name: string;
    description?: string;
    url: string; // 说明：基础 URL（例如 https://val.example.com）。
    mode: 'embed' | 'redirect'; // 说明：embed 在当前页面加载，redirect 跳转到外部站点。
    api?: { // 说明：redirect 模式不需要 api 配置。
        supabaseUrl: string;
        supabaseAnonKey: string;
    };
    addedAt: number;
}

const STORAGE_KEY = 'valpoint_subscriptions';

const getLocalSubscription = (): Subscription => {
    return {
        id: 'local',
        name: '共享库',
        description: 'ValPoint 官方公共点位库，汇集全网热门实战投掷物演示。',
        url: window.location.origin,
        mode: 'embed',
        api: {
            supabaseUrl,
            supabaseAnonKey
        },
        addedAt: 0
    };
};

export const getSubscriptionList = (): Subscription[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const list: Subscription[] = stored ? JSON.parse(stored) : [];
        return [getLocalSubscription(), ...list];
    } catch (e) {
        console.error('Failed to parse subscriptions', e);
        return [getLocalSubscription()];
    }
};


