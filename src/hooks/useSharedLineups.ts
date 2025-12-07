// @ts-nocheck
import { useCallback, useState } from 'react';
import { fetchSharedList, fetchSharedByShareId } from '../services/shared';

export const useSharedLineups = (mapNameZhToEn: Record<string, string>) => {
  const [sharedLineups, setSharedLineups] = useState<any[]>([]);

  const fetchSharedLineups = useCallback(async () => {
    const list = await fetchSharedList(mapNameZhToEn);
    setSharedLineups(list);
  }, [mapNameZhToEn]);

  const fetchSharedById = useCallback(
    async (shareId: string) => {
      const lineup = await fetchSharedByShareId(shareId, mapNameZhToEn);
      return lineup;
    },
    [mapNameZhToEn],
  );

  return { sharedLineups, setSharedLineups, fetchSharedLineups, fetchSharedById };
};
