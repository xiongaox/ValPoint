/**
 * useMapInfo - 点位地图Info
 *
 * 职责：
 * - 封装点位地图Info相关的状态与副作用。
 * - 对外提供稳定的接口与回调。
 * - 处理订阅、清理或缓存等生命周期细节。
 */

import { useMemo } from 'react';
import { CUSTOM_MAP_URLS, MAP_TRANSLATIONS, translateMapName, mapNameToEnglish } from '../../../constants/maps';
import { ActiveTab } from '../../../types/app';
import { MapOption, SharedLineup } from '../../../types/lineup';

type MapSide = 'all' | 'attack' | 'defense';

type MapInfoParams = {
  selectedMap: MapOption | null;
  selectedSide: MapSide;
};

export function useMapInfo({ selectedMap, selectedSide }: MapInfoParams) {
  const mapNameZhToEn = useMemo<Record<string, string>>(() => {
    const reverse: Record<string, string> = {};
    Object.entries(MAP_TRANSLATIONS).forEach(([en, zh]) => {
      reverse[zh] = en;
    });
    return reverse;
  }, []);

  const getMapDisplayName = translateMapName;

  const getMapEnglishName = mapNameToEnglish;

  const getMapUrl = (): string | null => {
    if (!selectedMap) return null;
    const config = (CUSTOM_MAP_URLS as Record<string, { attack: string; defense: string }>)[selectedMap.displayName];
    if (config) return selectedSide === 'defense' ? config.defense : config.attack;
    return selectedMap.displayIcon || null;
  };

  const getMapCoverUrl = () => {
    return selectedMap?.displayIcon || getMapUrl() || null;
  };

  return {
    mapNameZhToEn,
    getMapDisplayName,
    getMapEnglishName,
    getMapUrl,
    getMapCoverUrl,
  };
}
