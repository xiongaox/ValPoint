/**
 * usePinnedLineups.ts - 点位收藏/置顶管理 Hook
 * 
 * 职责：
 * - 维护用户收藏的点位 ID 列表
 * - 实现点位的置顶切换逻辑，并将状态持久化到本地或云端
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BaseLineup } from '../types/lineup';

type Params = {
  userId: string | null;
  lineups: BaseLineup[];
};

type PinnedStore = Record<string, string[]>;

const STORAGE_KEY = 'valpoint_pinned_lineups';

export function usePinnedLineups({ userId, lineups }: Params) {
  const [pinnedLineupIds, setPinnedLineupIds] = useState<string[]>([]);

  const readStore = useCallback((): PinnedStore => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as PinnedStore) : {};
    } catch {
      return {};
    }
  }, []);

  const writeStore = useCallback(
    (next: string[]) => {
      if (!userId) return;
      const store = readStore();
      store[userId] = next;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    },
    [readStore, userId],
  );

  useEffect(() => {
    if (!userId) {
      setPinnedLineupIds([]);
      return;
    }
    const store = readStore();
    const saved = store[userId] || [];
    const availableIds = lineups.map((l) => l.id);
    if (availableIds.length === 0) {
      setPinnedLineupIds(saved);
      return;
    }

    const sanitized = saved.filter((id) => availableIds.includes(id));
    if (sanitized.length !== saved.length) {
      writeStore(sanitized);
    }

    setPinnedLineupIds(sanitized);
  }, [lineups, readStore, userId, writeStore]);

  const togglePinnedLineup = useCallback(
    (id: string) => {
      if (!userId) return;
      setPinnedLineupIds((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev.filter((x) => x !== id)];
        writeStore(next);
        return next;
      });
    },
    [userId, writeStore],
  );

  const orderedLineups = useMemo(() => {
    if (!lineups.length) return [];
    const orderMap = lineups.reduce<Record<string, number>>((acc, curr, idx) => {
      acc[curr.id] = idx;
      return acc;
    }, {});
    return [...lineups].sort((a, b) => {
      const aPinned = pinnedLineupIds.includes(a.id);
      const bPinned = pinnedLineupIds.includes(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return orderMap[a.id] - orderMap[b.id];
    });
  }, [lineups, pinnedLineupIds]);

  const isPinned = useCallback((id: string) => pinnedLineupIds.includes(id), [pinnedLineupIds]);

  return { pinnedLineupIds, togglePinnedLineup, isPinned, orderedLineups };
}
