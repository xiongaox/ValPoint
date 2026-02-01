/**
 * lineups - 点位服务
 *
 * 职责：
 * - 封装点位相关的接口调用。
 * - 调用本地后端 API（替代 Supabase）。
 * - 向上层提供稳定的服务 API（保持原签名兼容）。
 */

import { normalizeLineup } from './normalize';
import { BaseLineup, LineupDbPayload } from '../types/lineup';

const API_BASE = '/api';

/**
 * 获取点位列表
 * @param userId - 用户ID（本地化后忽略）
 * @param mapNameZhToEn - 地图名称映射
 */
export async function fetchLineupsApi(
  userId: string,
  mapNameZhToEn: Record<string, string>
): Promise<BaseLineup[]> {
  const response = await fetch(`${API_BASE}/lineups`);

  if (!response.ok) {
    throw new Error('获取点位失败');
  }

  const data = await response.json();
  return data.map((d: any) => normalizeLineup(d, mapNameZhToEn));
}

/**
 * 创建点位
 */
export async function saveLineupApi(payload: LineupDbPayload): Promise<BaseLineup> {
  const response = await fetch(`${API_BASE}/lineups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '创建点位失败');
  }

  const data = await response.json();
  return normalizeLineup(data, {});
}

/**
 * 更新点位
 */
export async function updateLineupApi(id: string, payload: Partial<LineupDbPayload>): Promise<void> {
  const response = await fetch(`${API_BASE}/lineups/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '更新点位失败');
  }
}

/**
 * 删除点位
 */
export async function deleteLineupApi(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/lineups/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '删除点位失败');
  }
}

/**
 * 查找克隆来源（本地化后简化）
 */
export async function findLineupByClone(userId: string, clonedFrom: string) {
  // 本地化版本暂不支持克隆追踪
  return null;
}

/**
 * 清空所有点位
 */
export async function clearLineupsApi(userId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/lineups`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('清空点位失败');
  }
}

/**
 * 清空指定英雄的点位
 */
export async function clearLineupsByAgentApi(userId: string, agentName: string): Promise<void> {
  const response = await fetch(`${API_BASE}/lineups?agent=${encodeURIComponent(agentName)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('清空英雄点位失败');
  }
}

/**
 * 获取点位统计
 */
export async function fetchStatsApi(): Promise<{
  total: number;
  byAgent: { agent_name: string; count: number }[];
  byMap: { map_name: string; count: number }[];
}> {
  const response = await fetch(`${API_BASE}/stats`);

  if (!response.ok) {
    throw new Error('获取统计失败');
  }

  return response.json();
}

/**
 * 获取视频作者信息（B站/抖音）
 */
export async function fetchAuthorInfoApi(url: string): Promise<{
  username: string;
  avatar: string;
  user_home_url: string;
  source: string;
}> {
  const response = await fetch(`${API_BASE}/proxy/author`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '获取作者信息失败');
  }

  const result = await response.json();
  return result.data;
}


/**
 * 上传图片
 */
export async function uploadImageApi(
  file: File | Blob,
  fileName: string,
  map?: string,
  agent?: string,
  type?: string,
  ability?: string,
  lineupTitle?: string,
  slot?: string
): Promise<{ success: boolean; path: string; filename: string }> {
  const formData = new FormData();
  formData.append('file', file, fileName);

  const query = new URLSearchParams();
  if (map) query.append('map', map);
  if (agent) query.append('agent', agent);
  if (type) query.append('type', type);
  if (ability) query.append('ability', ability);
  if (lineupTitle) query.append('lineupTitle', lineupTitle);
  if (slot) query.append('slot', slot);

  const response = await fetch(`${API_BASE}/upload?${query.toString()}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '图片上传失败');
  }

  return response.json();
}
