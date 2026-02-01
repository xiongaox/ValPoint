/**
 * playerCardAvatars - player卡片Avatars
 *
 * 职责：
 * - 提供player卡片Avatars相关的纯函数工具。
 * - 封装常用转换或格式化逻辑。
 * - 降低重复代码并提升可复用性。
 */

export interface PlayerCardAvatar {
    uuid: string; // 说明：卡面唯一标识。
    name: string; // 说明：卡面名称（中文）。
    url: string; // 说明：displayIcon URL。
}

let cachedCards: PlayerCardAvatar[] | null = null;
let loadingPromise: Promise<PlayerCardAvatar[]> | null = null;

const OSS_BASE_URL = import.meta.env.VITE_OSS_PLAYERCARDS_BASE_URL || '';

const LOCAL_JSON_PATH = '/avatars/index.json';

const VALORANT_API_URL = 'https://valorant-api.com/v1/playercards?language=zh-CN';

async function fetchFromValorantAPI(): Promise<PlayerCardAvatar[]> {
    const response = await fetch(VALORANT_API_URL);
    const { data } = await response.json();

    return data
        .filter((card: any) => !card.isHiddenIfNotOwned)
        .map((card: any) => ({
            uuid: card.uuid,
            name: card.displayName,
            url: card.displayIcon,
        }));
}

async function fetchFromLocalJSON(): Promise<PlayerCardAvatar[] | null> {
    try {
        const response = await fetch(LOCAL_JSON_PATH);
        if (!response.ok) return null;
        const data = await response.json();
        return data.map((item: any) => ({
            uuid: String(item.id),
            name: item.name,
            url: item.url
        }));
    } catch {
        return null;
    }
}

export async function loadPlayerCardAvatars(): Promise<PlayerCardAvatar[]> {
    if (cachedCards) return cachedCards;

    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
        try {
            const localData = await fetchFromLocalJSON();
            if (localData && localData.length > 0) {
                console.log('[PlayerCards] 使用本地 OSS 数据');
                cachedCards = localData;
                return localData;
            }
        } catch (e) {
            console.warn('[PlayerCards] 本地数据加载失败，使用 Valorant API');
        }

        console.log('[PlayerCards] 使用 Valorant API');
        const apiData = await fetchFromValorantAPI();
        cachedCards = apiData;
        return apiData;
    })();

    return loadingPromise;
}

export function getPlayerCardAvatarsSync(): PlayerCardAvatar[] {
    return cachedCards || [];
}

export function getDefaultPlayerCardAvatar(): string {
    const cards = getPlayerCardAvatarsSync();
    if (cards.length > 0) {
        return cards[0].url;
    }
    return 'https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/displayicon.png';
}

export function getPlayerCardByUserId(userId: string): string {
    const cards = getPlayerCardAvatarsSync();
    if (cards.length === 0) {
        return getDefaultPlayerCardAvatar();
    }

    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = ((hash << 5) - hash) + userId.charCodeAt(i);
        hash = hash & hash;
    }
    const index = Math.abs(hash) % cards.length;
    return cards[index].url;
}

export function getPlayerCardByEmail(email: string): string {
    return getPlayerCardByUserId((email || '').toLowerCase());
}

export function preloadPlayerCards(): void {
    loadPlayerCardAvatars().catch(err => {
        console.warn('[PlayerCards] 预加载失败:', err);
    });
}
