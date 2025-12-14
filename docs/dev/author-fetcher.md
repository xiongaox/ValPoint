# 作者信息解析

作者信息自动获取是 ValPoint 的核心功能之一，支持从 B 站和抖音视频链接自动解析作者信息。

## 技术方案

### 架构设计

```
前端 (Browser)
    │
    │ 1. 用户输入视频链接
    ▼
authorFetcher.ts
    │
    │ 2. 调用 Edge Function
    ▼
Supabase Edge Function
(get-video-author)
    │
    │ 3. 服务端请求
    ▼
B 站 / 抖音 API
    │
    │ 4. 返回 HTML/JSON
    ▼
解析逻辑
    │
    │ 5. 提取作者信息
    ▼
返回前端
    │
    │ 6. 显示作者信息
    ▼
用户界面
```

### 为什么需要 Edge Function？

#### 问题

1. **CORS 限制**
   - B 站和抖音的 API 不允许跨域请求
   - 浏览器会阻止直接请求

2. **反爬虫机制**
   - 需要特定的 User-Agent
   - 需要 Referer 头
   - 可能需要 Cookie

3. **IP 限制**
   - 频繁请求可能被封 IP
   - 需要服务端代理

#### 解决方案

使用 Supabase Edge Function 作为代理：
- 绕过 CORS 限制
- 伪装 User-Agent
- 服务端请求，不受浏览器限制

## 前端实现

### authorFetcher.ts

```typescript
// src/utils/authorFetcher.ts

export type AuthorInfo = {
  name: string;           // 作者昵称
  avatar: string;         // 头像 URL
  uid?: string;           // 用户 ID
  homeUrl?: string;       // 主页链接
  coverImage?: string;    // 视频封面（仅 B 站）
  isCover?: boolean;      // 是否使用封面代替头像
  source?: 'bilibili' | 'douyin';
};

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

export async function fetchAuthorInfo(
  sourceLink: string
): Promise<AuthorInfo | null> {
  try {
    const url = new URL(sourceLink);
    
    // 检查是否为支持的平台
    if (
      !url.hostname.includes('bilibili.com') && 
      !url.hostname.includes('douyin.com') && 
      !url.hostname.includes('b23.tv')
    ) {
      return null;
    }
    
    // 使用统一的 Edge Function
    return await fetchAuthorViaEdgeFunction(sourceLink);
  } catch (error) {
    console.error('获取作者信息失败:', error);
    return null;
  }
}

async function fetchAuthorViaEdgeFunction(
  url: string
): Promise<AuthorInfo | null> {
  try {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Supabase 配置缺失');
      return null;
    }
    
    // 调用 Edge Function
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/get-video-author`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ url }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Edge Function 错误 ${response.status}:`, errorText);
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
        const midMatch = result.data.user_home_url.match(
          /space\.bilibili\.com\/(\d+)/
        );
        uid = midMatch ? midMatch[1] : undefined;
      } else if (result.data.source === 'douyin') {
        // 抖音：从主页链接提取 sec_uid
        const secUidMatch = result.data.user_home_url.match(
          /\/user\/(MS4wLjABAAAA[A-Za-z0-9_\-]+)/
        );
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
```

### 组件集成

#### EditorModal.tsx

```typescript
// 自动获取机制（防抖）
useEffect(() => {
  const link = newLineupData.sourceLink?.trim();

  if (fetchTimeoutRef.current) {
    clearTimeout(fetchTimeoutRef.current);
  }

  if (!link || newLineupData.authorName) {
    return;
  }

  // 1 秒防抖
  fetchTimeoutRef.current = setTimeout(async () => {
    try {
      setIsFetchingAuthor(true);
      const authorInfo = await fetchAuthorInfo(link);

      if (authorInfo) {
        setNewLineupData((prev) => ({
          ...prev,
          authorName: authorInfo.name,
          authorAvatar: authorInfo.avatar,
          authorUid: authorInfo.uid || '',
        }));
      }
    } catch (error) {
      console.error('自动获取作者信息失败:', error);
    } finally {
      setIsFetchingAuthor(false);
    }
  }, 1000);

  return () => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
  };
}, [newLineupData.sourceLink, setNewLineupData]);

// 手动刷新按钮
<button
  type="button"
  onClick={async () => {
    const link = newLineupData.sourceLink?.trim();
    if (!link) {
      setAlertMessage?.('请先输入来源链接');
      return;
    }
    try {
      setIsFetchingAuthor(true);
      const authorInfo = await fetchAuthorInfo(link);
      if (authorInfo) {
        setNewLineupData((prev) => ({
          ...prev,
          authorName: authorInfo.name,
          authorAvatar: authorInfo.avatar,
          authorUid: authorInfo.uid || '',
        }));
        setAlertMessage?.('作者信息已更新');
      } else {
        setAlertMessage?.('无法获取作者信息');
      }
    } catch (error) {
      console.error('手动刷新作者信息失败:', error);
      setAlertMessage?.('获取作者信息失败');
    } finally {
      setIsFetchingAuthor(false);
    }
  }}
  disabled={isFetchingAuthor || !newLineupData.sourceLink?.trim()}
>
  <Icon name="RefreshCw" className={isFetchingAuthor ? 'animate-spin' : ''} />
  {isFetchingAuthor ? '获取中...' : '手动刷新'}
</button>
```

#### ViewerModal.tsx

```typescript
// 自动获取（如果未保存）
useEffect(() => {
  if (!viewingLineup?.sourceLink) {
    setAuthorInfo(null);
    setIsLoadingAuthor(false);
    return;
  }

  // 如果已有作者信息，直接使用
  if (viewingLineup?.authorName && viewingLineup?.authorAvatar) {
    setAuthorInfo({
      name: viewingLineup.authorName,
      avatar: viewingLineup.authorAvatar,
      uid: viewingLineup.authorUid || undefined,
    });
    return;
  }

  // 否则自动获取
  setIsLoadingAuthor(true);
  fetchAuthorInfo(viewingLineup.sourceLink)
    .then((info) => {
      if (info) setAuthorInfo(info);
    })
    .finally(() => setIsLoadingAuthor(false));
}, [viewingLineup]);

// 显示作者信息
{authorInfo && viewingLineup.sourceLink && (
  authorInfo.uid ? (
    <a
      href={
        authorInfo.uid.startsWith('MS4') 
          ? `https://www.douyin.com/user/${authorInfo.uid}` 
          : `https://space.bilibili.com/${authorInfo.uid}`
      }
      target="_blank"
      rel="noopener noreferrer"
    >
      <img 
        src={authorInfo.avatar} 
        referrerPolicy="no-referrer"  // 🔥 防盗链
        alt={authorInfo.name}
      />
      <span>{authorInfo.name}</span>
    </a>
  ) : (
    <div>
      <img 
        src={authorInfo.avatar} 
        referrerPolicy="no-referrer"  // 🔥 防盗链
        alt={authorInfo.name}
      />
      <span>{authorInfo.name}</span>
    </div>
  )
)}
```

## 后端实现

### Edge Function 结构

```
supabase/functions/get-video-author/
├── index.ts          # 主入口
├── bilibili.ts       # B 站解析逻辑
└── douyin.ts         # 抖音解析逻辑
```

### index.ts

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { fetchBilibiliAuthor } from './bilibili.ts';
import { fetchDouyinAuthor } from './douyin.ts';

serve(async (req) => {
  // 处理 CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ status: 'error', message: '只支持 POST 请求' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ status: 'error', message: '缺少 url 参数' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 判断平台并调用对应的处理函数
    let authorData = null;

    if (url.includes('bilibili.com') || url.includes('b23.tv')) {
      authorData = await fetchBilibiliAuthor(url);
    } else if (url.includes('douyin.com')) {
      authorData = await fetchDouyinAuthor(url);
    } else {
      return new Response(
        JSON.stringify({ status: 'error', message: '不支持的平台' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!authorData) {
      return new Response(
        JSON.stringify({ status: 'error', message: '无法获取作者信息' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ status: 'success', data: authorData }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('处理请求时出错:', error);
    
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error instanceof Error ? error.message : '服务器内部错误',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

### bilibili.ts

```typescript
export interface BilibiliAuthorData {
  username: string;
  avatar: string;
  user_home_url: string;
  is_cover: boolean;
  source: 'bilibili';
  cover_image?: string;
}

function fixBilibiliAvatar(avatar: string): string {
  if (avatar.startsWith('//')) {
    return 'https:' + avatar;
  }
  if (avatar.startsWith('http://')) {
    return avatar.replace('http://', 'https://');
  }
  return avatar;
}

export async function fetchBilibiliAuthor(
  url: string
): Promise<BilibiliAuthorData | null> {
  try {
    // 提取 BV 号
    const bvMatch = url.match(/BV[\w]+/);
    if (!bvMatch) {
      return null;
    }

    const bvid = bvMatch[0];
    const apiUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.bilibili.com',
      },
    });
    
    const data = await response.json();
    
    if (data.code === 0 && data.data && data.data.owner) {
      const mid = data.data.owner.mid;
      const coverImage = data.data.pic ? fixBilibiliAvatar(data.data.pic) : undefined;
      
      return {
        username: data.data.owner.name,
        avatar: fixBilibiliAvatar(data.data.owner.face),
        user_home_url: `https://space.bilibili.com/${mid}`,
        is_cover: false,
        source: 'bilibili',
        cover_image: coverImage,
      };
    }
    
    return null;
  } catch (error) {
    console.error('获取 B 站作者信息失败:', error);
    throw error;
  }
}
```

## 防盗链处理

### 问题

B 站和抖音的图片服务器开启了 Referer 验证：
- 直接加载图片会返回 403 Forbidden
- 浏览器会阻止跨域图片加载

### 解决方案

在所有 `<img>` 标签添加 `referrerPolicy="no-referrer"`：

```tsx
<img 
  src={authorInfo.avatar} 
  referrerPolicy="no-referrer"  // 🔥 关键
  alt={authorInfo.name}
/>
```

### 原理

- `referrerPolicy="no-referrer"` 告诉浏览器不发送 Referer 头
- 图片服务器无法判断来源，允许加载
- 不影响图片显示

## 性能优化

### 1. 防抖机制

```typescript
// 1 秒防抖，避免频繁调用
fetchTimeoutRef.current = setTimeout(async () => {
  const authorInfo = await fetchAuthorInfo(link);
  // ...
}, 1000);
```

### 2. 缓存策略

```typescript
// 如果已有作者信息，直接使用
if (viewingLineup?.authorName && viewingLineup?.authorAvatar) {
  setAuthorInfo({
    name: viewingLineup.authorName,
    avatar: viewingLineup.authorAvatar,
    uid: viewingLineup.authorUid,
  });
  return;
}
```

### 3. 错误处理

```typescript
try {
  const authorInfo = await fetchAuthorInfo(link);
  // ...
} catch (error) {
  console.error('获取作者信息失败:', error);
  // 静默失败，不影响用户操作
  return null;
}
```

## 测试

### 单元测试

```typescript
describe('authorFetcher', () => {
  it('should extract bilibili author info', async () => {
    const url = 'https://www.bilibili.com/video/BV19rmoBqEdK/';
    const info = await fetchAuthorInfo(url);
    
    expect(info).not.toBeNull();
    expect(info?.name).toBe('蘅鲼');
    expect(info?.source).toBe('bilibili');
  });

  it('should return null for invalid url', async () => {
    const url = 'https://example.com';
    const info = await fetchAuthorInfo(url);
    
    expect(info).toBeNull();
  });
});
```

### 集成测试

```bash
# 测试 Edge Function
curl -X POST https://[PROJECT_ID].supabase.co/functions/v1/get-video-author \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [ANON_KEY]" \
  -d '{"url":"https://www.bilibili.com/video/BV19rmoBqEdK/"}'
```

## 常见问题

### Q: 为什么不直接在前端请求？

**A:** CORS 限制和反爬虫机制。浏览器会阻止跨域请求。

### Q: Edge Function 会增加延迟吗？

**A:** 会有一定延迟（通常 < 1 秒），但可以接受。使用防抖和缓存可以优化体验。

### Q: 如何处理 API 变化？

**A:** 
1. 监控错误日志
2. 及时更新解析逻辑
3. 添加降级方案（使用封面图）

### Q: 支持其他平台吗？

**A:** 目前仅支持 B 站和抖音。添加新平台需要：
1. 研究平台 API
2. 实现解析逻辑
3. 更新 Edge Function


<!--
## 未来优化

- [ ] 添加缓存层（Redis）
- [ ] 支持更多平台（YouTube、TikTok）
- [ ] 批量获取作者信息
- [ ] 实时更新作者信息
- [ ] AI 识别视频内容
-->
