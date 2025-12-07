// @ts-nocheck
import { useCallback, useState } from 'react';
import { fetchLineupsApi } from '../services/lineups';

export const useLineups = (mapNameZhToEn: Record<string, string>) => {
  const [lineups, setLineups] = useState<any[]>([]);

  const fetchLineups = useCallback(
    async (userId: string | null) => {
      if (!userId) return;
      const list = await fetchLineupsApi(userId, mapNameZhToEn);
      setLineups(list);
    },
    [mapNameZhToEn],
  );

  return { lineups, setLineups, fetchLineups };
};
