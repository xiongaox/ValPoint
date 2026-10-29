/**
 * check-position-clusters - 站位/落点聚类最小断言
 *
 * 运行：node scripts/check-position-clusters.ts
 */

import assert from 'node:assert/strict';
import { clusterPositions, uniqueCandidates, POSITION_MERGE_TOLERANCE } from '../src/features/lineups/lineupPositions.ts';

const a = { id: 'a', agent: 'Jett', pos: { lat: 100, lng: 100 } };
const near = { id: 'near', agent: 'Jett', pos: { lat: 103, lng: 104 } };
const far = { id: 'far', agent: 'Jett', pos: { lat: 100, lng: 140 } };
const otherAgent = { id: 'other', agent: 'Raze', pos: { lat: 101, lng: 101 } };
const noPos = { id: 'none', agent: 'Jett', pos: null };

const byAgent = (i: typeof a) => i.agent;
const byPos = (i: typeof a) => i.pos;

// 相距 5 → 合并
const merged = clusterPositions([a, near], byPos, byAgent);
assert.equal(merged.length, 1, '相近坐标应合并为一个簇');
assert.equal(merged[0].members.length, 2);
assert.deepEqual(merged[0].pos, a.pos, '簇锚点应为首成员坐标');

// 相距 40 → 不合并
const split = clusterPositions([a, far], byPos, byAgent);
assert.equal(split.length, 2, '超出容差的坐标不应合并');

// 容差边界
assert.equal(POSITION_MERGE_TOLERANCE, 8);
assert.equal(clusterPositions([a, { ...near, pos: { lat: 100 + POSITION_MERGE_TOLERANCE, lng: 100 } }], byPos, byAgent).length, 1);

// 跨英雄不合并
assert.equal(clusterPositions([a, otherAgent], byPos, byAgent).length, 2, '不同英雄不应合并');

// 空坐标忽略
assert.equal(clusterPositions([a, noPos], byPos, byAgent).length, 1);

// 候选点去重 + 图标透传
assert.deepEqual(
  uniqueCandidates(merged, () => 'icon-a.webp'),
  [{ pos: { lat: 100, lng: 100 }, icon: 'icon-a.webp' }],
);
assert.deepEqual(uniqueCandidates(merged).map((c) => c.icon), [null]);

console.log('check-position-clusters: all assertions passed');
