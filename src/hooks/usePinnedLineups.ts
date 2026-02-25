/**
 * usePinnedLineups - Hook 层
 *
 * 模块定位：
 * - 所在层级：Hook 层
 * - 主要目标：封装状态、副作用与交互流程
 *
 * 关键职责：
 * - 封装状态管理与副作用控制
 * - 对外暴露清晰的交互动作与派生状态
 * - 隔离组件层与数据层耦合
 *
 * 主要导出：
 * - `usePinnedLineups`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`../types/lineup`、`../supabaseClient`
 * - 下游影响：供组件与控制器复用
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BaseLineup } from '../types/lineup';
import { supabase } from '../supabaseClient';

type Params = {
  userId: string | null;
  lineups: BaseLineup[];
};

const STORAGE_KEY = 'valpoint_pinned_lineups';

export function usePinnedLineups({ userId, lineups }: Params) {
  const [pinnedLineupIds, setPinnedLineupIds] = useState<string[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    if (!userId) {
      setPinnedLineupIds([]);
      return;
    }

    let isMounted = true;

    async function loadAndMigrate() {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('pinned_lineup_ids')
          .eq('id', userId)
          .single();

        if (error) throw error;

        const dbPins: string[] = data?.pinned_lineup_ids || [];

        const rawLocal = localStorage.getItem(STORAGE_KEY);
        const localStore = rawLocal ? JSON.parse(rawLocal) : {};
        const localPins = userId ? (localStore[userId] || []) : [];

        if (dbPins.length === 0 && localPins.length > 0 && userId) {
          if (isMounted) setIsMigrating(true);
          console.log('[PinnedLineups] Detected local pins, migrating to DB...', localPins);

          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ pinned_lineup_ids: localPins })
            .eq('id', userId);

          if (!updateError) {
            console.log('[PinnedLineups] Migration successful.');
            if (isMounted) setPinnedLineupIds(localPins);
            delete localStore[userId];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(localStore));
          } else {
            console.error('[PinnedLineups] Migration failed:', updateError);
          }
        } else {
          if (isMounted) setPinnedLineupIds(dbPins);
        }
      } catch (err) {
        console.error('[PinnedLineups] Load error:', err);
      } finally {
        if (isMounted) setIsMigrating(false);
      }
    }

    loadAndMigrate();

    return () => {
      isMounted = false;
    };
  }, [userId]);


  const togglePinnedLineup = useCallback(
    async (id: string) => {
      if (!userId) return;

      setPinnedLineupIds((prev) => {
        const next = prev.includes(id)
          ? prev.filter((x) => x !== id)
          : [id, ...prev.filter((x) => x !== id)]; // 说明：新置顶排在最前。

        supabase
          .from('user_profiles')
          .update({ pinned_lineup_ids: next })
          .eq('id', userId)
          .then(({ error }) => {
            if (error) {
              console.error('[PinnedLineups] Update failed, rolling back.', error);
            }
          });

        return next;
      });
    },
    [userId],
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

  return { pinnedLineupIds, togglePinnedLineup, isPinned, orderedLineups, isMigrating };
}
