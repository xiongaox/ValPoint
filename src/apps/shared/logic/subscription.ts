/**
 * subscription - 应用壳层(shared)
 *
 * 模块定位：
 * - 所在层级：应用壳层(shared)
 * - 主要目标：承载共享库业务流程与 UI 组合
 *
 * 关键职责：
 * - 承载应用入口装配与页面级流程
 * - 协调共享模块与业务模块的组合
 * - 保证不同 MPA 入口行为一致且可维护
 *
 * 主要导出：
 * - `Subscription`、`getSubscriptionList`、`addSubscription`、`removeSubscription`、`updateSubscription`、`reorderSubscription`
 *
 * 依赖关系：
 * - 上游依赖：无显式外部模块依赖
 * - 下游影响：供 index.html 入口挂载
 */

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
            supabaseUrl: (window as any).__ENV__?.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL,
            supabaseAnonKey: (window as any).__ENV__?.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY
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

export const addSubscription = (sub: Subscription) => {
    const list = getSubscriptionList().filter(s => s.id !== 'local'); // 说明：排除本地虚拟项。
    if (list.some(s => s.url === sub.url)) {
        throw new Error('This library is already subscribed.');
    }
    list.push(sub);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

export const removeSubscription = (id: string) => {
    if (id === 'local') return;
    const list = getSubscriptionList().filter(s => s.id !== 'local' && s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

export const updateSubscription = (sub: Subscription) => {
    if (sub.id === 'local') return;
    const list = getSubscriptionList();
    const index = list.findIndex(s => s.id === sub.id);
    if (index !== -1) {
        list[index] = sub;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list.filter(s => s.id !== 'local')));
    }
};

export const reorderSubscription = (id: string, direction: 'up' | 'down') => {
    if (id === 'local') return;
    const list = getSubscriptionList().filter(s => s.id !== 'local');
    const index = list.findIndex(s => s.id === id);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
        [list[index - 1], list[index]] = [list[index], list[index - 1]];
    } else if (direction === 'down' && index < list.length - 1) {
        [list[index + 1], list[index]] = [list[index], list[index + 1]];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

export const fetchManifest = async (url: string): Promise<Subscription> => {
    let baseUrl = url.replace(/\/$/, ''); // 说明：移除末尾斜杠。
    if (!baseUrl.startsWith('http')) {
        baseUrl = `https://${baseUrl}`;
    }

    try {
        const response = await fetch(`${baseUrl}/valpoint.json`);
        if (!response.ok) {
            throw new Error(`Failed to fetch manifest: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();

        if (!data.api || !data.api.supabaseUrl || !data.api.supabaseAnonKey) {
            throw new Error('Invalid manifest: Missing API configuration');
        }

        const mode = data.mode === 'redirect' ? 'redirect' : 'embed';

        const subscription: Subscription = {
            id: crypto.randomUUID(),
            name: data.name || 'Unknown Library',
            description: data.description,
            url: baseUrl,
            mode,
            addedAt: Date.now()
        };

        if (mode === 'embed') {
            subscription.api = {
                supabaseUrl: data.api.supabaseUrl,
                supabaseAnonKey: data.api.supabaseAnonKey
            };
        }

        return subscription;
    } catch (e: any) {
        throw new Error(`Connection failed: ${e.message}`);
    }
};


