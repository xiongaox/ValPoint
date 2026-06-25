import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { TABLE } from '../services/tables';

export type ErrorMarkType = '描述错误' | '图片错误' | '图片未标记';

type ErrorMarkEventDetail = {
  lineupId: string;
  type: ErrorMarkType | null;
};

export function useErrorMarks(userId?: string) {
  const [errorMarks, setErrorMarks] = useState<Record<string, ErrorMarkType>>({});
  const [loading, setLoading] = useState(false);

  const fetchErrorMarks = useCallback(async () => {
    if (!userId) {
      setErrorMarks({});
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(TABLE.errorMarks)
        .select('lineup_id, error_type')
        .eq('user_id', userId);

      if (error) throw error;

      const marksMap: Record<string, ErrorMarkType> = {};
      data?.forEach((mark: any) => {
        marksMap[mark.lineup_id] = mark.error_type as ErrorMarkType;
      });
      setErrorMarks(marksMap);
    } catch (err) {
      console.error('获取报错标记失败:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchErrorMarks();
  }, [fetchErrorMarks]);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<ErrorMarkEventDetail>;
      const { lineupId, type } = customEvent.detail;
      if (type) {
        setErrorMarks((prev) => ({ ...prev, [lineupId]: type }));
      } else {
        setErrorMarks((prev) => {
          const newMarks = { ...prev };
          delete newMarks[lineupId];
          return newMarks;
        });
      }
    };
    window.addEventListener('errorMarksLocalUpdate', handleUpdate);
    return () => window.removeEventListener('errorMarksLocalUpdate', handleUpdate);
  }, []);

  const markError = async (lineupId: string, type: ErrorMarkType) => {
    if (!userId) return false;

    // Global Optimistic update
    window.dispatchEvent(new CustomEvent('errorMarksLocalUpdate', { detail: { lineupId, type } }));

    try {
      const { error } = await supabase
        .from(TABLE.errorMarks)
        .upsert(
          { user_id: userId, lineup_id: lineupId, error_type: type },
          { onConflict: 'user_id, lineup_id' }
        );

      if (error) {
        throw error;
      }
      return true;
    } catch (err) {
      console.error('保存报错标记失败:', err);
      // Revert optimistic update
      await fetchErrorMarks();
      return false;
    }
  };

  const resolveError = async (lineupId: string) => {
    if (!userId) return false;

    // Global Optimistic update
    window.dispatchEvent(new CustomEvent('errorMarksLocalUpdate', { detail: { lineupId, type: null } }));

    try {
      const { error } = await supabase
        .from(TABLE.errorMarks)
        .delete()
        .eq('user_id', userId)
        .eq('lineup_id', lineupId);

      if (error) {
        throw error;
      }
      return true;
    } catch (err) {
      console.error('清除报错标记失败:', err);
      // Revert optimistic update
      await fetchErrorMarks();
      return false;
    }
  };

  return { errorMarks, loading, fetchErrorMarks, markError, resolveError };
}
