/**
 * authorFetcher - 占位模块（本地版本）
 * 获取视频作者信息（调用本地 API）
 */

export interface AuthorInfo {
    username: string;
    avatar: string;
    user_home_url: string;
    source: string;
}

/**
 * 从 B站/抖音 视频链接获取作者信息
 */
export async function fetchAuthorInfo(url: string): Promise<AuthorInfo | null> {
    try {
        const response = await fetch('/api/proxy/author', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
        });

        if (!response.ok) {
            console.error('获取作者信息失败');
            return null;
        }

        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error('获取作者信息失败:', error);
        return null;
    }
}
