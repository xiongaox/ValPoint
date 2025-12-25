export type AuthorInfo = {
  name: string;
  avatar: string;
  uid?: string; // 用户ID
  homeUrl?: string; // 用户主页链接
  coverImage?: string; // 视频封面图
  isCover?: boolean; // 是否使用封面图代替头像
  source?: 'bilibili' | 'douyin'; // 平台来源
};

/**
 * authorFetcher.ts - 点位作者信息获取工具
 * 
 * 职责：
 * - 通过 user_id 批量或单个查询作者的昵称和头像
 * - 提供缓存机制以减少对 user_profiles 表的频繁查询
 */
import { supabase } from '../supabaseClient';

// Edge Function 响应类型
interface EdgeFunctionResponse {
  status: 'success' | 'error';
  data?: {
    username: string;
    avatar: string;
    user_home_url: string;
    is_cover: boolean;
    source: 'bilibili' | 'douyin';
    cover_image?: string;
  };
  message?: string;
  error?: string;
}

function looksLikeJwt(token: string): boolean {
  const parts = token.split('.');
  return parts.length === 3 && parts.every(Boolean);
}

async function getEdgeFunctionBearerToken(projectKey: string): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.warn('获取 Supabase Session 失败，将回退到项目 Key:', error.message);
  }

  const accessToken = data.session?.access_token;
  if (accessToken) return accessToken;

  if (looksLikeJwt(projectKey)) return projectKey;

  return null;
}

export async function fetchAuthorInfo(sourceLink: string): Promise<AuthorInfo | null> {
  try {
    const url = new URL(sourceLink);

    // 检查是否为支持的平台
    if (!url.hostname.includes('bilibili.com') && !url.hostname.includes('douyin.com') && !url.hostname.includes('b23.tv')) {
      return null;
    }

    // 使用统一的 Edge Function
    return await fetchAuthorViaEdgeFunction(sourceLink);
  } catch (error) {
    console.error('获取作者信息失败:', error);
    return null;
  }
}

async function fetchAuthorViaEdgeFunction(url: string): Promise<AuthorInfo | null> {
  try {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Supabase 配置缺失');
      return null;
    }

    const bearerToken = await getEdgeFunctionBearerToken(SUPABASE_ANON_KEY);

    // 调用统一的 get-video-author 接口（同时支持抖音和 B 站）
    const response = await fetch(`${SUPABASE_URL}/functions/v1/get-video-author`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Edge Function 错误 ${response.status}:`, errorText);
      if (response.status === 401 && !bearerToken) {
        console.error(
          '当前未能生成有效的 Bearer Token（未登录且 VITE_SUPABASE_ANON_KEY 非 JWT）。请改用 Supabase anon JWT key（形如 xxx.yyy.zzz），或将 Edge Function 配置为 verify_jwt=false。',
        );
      }
      return null;
    }

    const result: EdgeFunctionResponse = await response.json();

    // 处理错误响应
    if (result.status === 'error' || result.error) {
      console.error('获取作者信息失败:', result.message || result.error);
      return null;
    }

    if (result.status === 'success' && result.data) {
      // 提取用户 ID
      let uid: string | undefined;

      if (result.data.source === 'bilibili') {
        // B 站：从主页链接提取 mid
        const midMatch = result.data.user_home_url.match(/space\.bilibili\.com\/(\d+)/);
        uid = midMatch ? midMatch[1] : undefined;
      } else if (result.data.source === 'douyin') {
        // 抖音：从主页链接提取 sec_uid
        const secUidMatch = result.data.user_home_url.match(/\/user\/(MS4wLjABAAAA[A-Za-z0-9_\-]+)/);
        uid = secUidMatch ? secUidMatch[1] : undefined;
      }

      return {
        name: result.data.username,
        avatar: result.data.avatar,
        uid,
        homeUrl: result.data.user_home_url,
        coverImage: result.data.cover_image,
        isCover: result.data.is_cover,
        source: result.data.source,
      };
    }

    return null;
  } catch (error) {
    console.error('调用 Edge Function 失败:', error);
    return null;
  }
}
