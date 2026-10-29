/**
 * lineupPositions - 站位/落点坐标工具
 *
 * 职责：
 * - 将同一英雄下相近的站位/落点坐标归并为簇，用于显示层合并与"选择已有"候选。
 * - 纯函数，不依赖 React，便于单独断言。
 */

import type { LineupPosition } from '../../types/lineup';

/** 两个坐标在该距离（0~1000 地图单位）内视为同一个站位/落点。 */
export const POSITION_MERGE_TOLERANCE = 8;

export type PositionCluster<T> = {
  /** 簇内首成员的坐标，作为显示锚点。 */
  key: string;
  pos: LineupPosition;
  members: T[];
};

export const positionKey = (pos: LineupPosition | null | undefined): string =>
  pos ? `${pos.lat.toFixed(1)},${pos.lng.toFixed(1)}` : '';

const isPosition = (pos: LineupPosition | null | undefined): pos is LineupPosition =>
  !!pos && Number.isFinite(pos.lat) && Number.isFinite(pos.lng);

const distance = (a: LineupPosition, b: LineupPosition) => Math.hypot(a.lat - b.lat, a.lng - b.lng);

/**
 * 贪心单链聚类：按 `getGroupKey` 分组（例如仅英雄，或英雄+技能），
 * 与已有簇锚点距离 ≤ tolerance 则并入该簇，否则新建簇。
 * 锚点固定为首成员坐标，保证渲染稳定。
 */
export function clusterPositions<T>(
  items: T[],
  getPos: (item: T) => LineupPosition | null | undefined,
  getGroupKey: (item: T) => string,
  tolerance: number = POSITION_MERGE_TOLERANCE,
): PositionCluster<T>[] {
  const clusters: (PositionCluster<T> & { group: string })[] = [];

  items.forEach((item) => {
    const pos = getPos(item);
    if (!isPosition(pos)) return;
    const group = getGroupKey(item);
    const hit = clusters.find((c) => c.group === group && distance(c.pos, pos) <= tolerance);
    if (hit) {
      hit.members.push(item);
      return;
    }
    clusters.push({ group, key: `${group}#${clusters.length}`, pos, members: [item] });
  });

  return clusters.map(({ group, ...rest }) => rest);
}

/** 地图"选择已有"候选点：坐标 + 该点应显示的图标（站位用英雄头像，落点用技能图标）。 */
export type PositionCandidate = { pos: LineupPosition; icon?: string | null };

/** 去重后的候选点列表。 */
export function uniqueCandidates<T>(
  clusters: PositionCluster<T>[],
  getIcon?: (cluster: PositionCluster<T>) => string | null | undefined,
): PositionCandidate[] {
  const seen = new Set<string>();
  const result: PositionCandidate[] = [];
  clusters.forEach((c) => {
    const key = positionKey(c.pos);
    if (seen.has(key)) return;
    seen.add(key);
    result.push({ pos: { lat: c.pos.lat, lng: c.pos.lng }, icon: getIcon?.(c) ?? null });
  });
  return result;
}
