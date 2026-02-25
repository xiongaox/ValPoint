/**
 * useMapInfo - Feature 控制器层
 *
 * 模块定位：
 * - 所在层级：Feature 控制器层
 * - 主要目标：拆分点位业务流程与状态编排
 *
 * 关键职责：
 * - 按职责拆分点位业务控制器
 * - 组合状态、动作与生命周期逻辑
 * - 为视图层提供可直接消费的 props/handler
 *
 * 主要导出：
 * - `useMapInfo`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`../../../constants/maps`、`../../../types/app`、`../../../types/lineup`
 * - 下游影响：供 feature 入口控制器组合
 */

import { useMemo } from 'react';
import { CUSTOM_MAP_URLS, MAP_TRANSLATIONS } from '../../../constants/maps';
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

  const getMapDisplayName = (apiMapName: string) => MAP_TRANSLATIONS[apiMapName] || apiMapName;

  const getMapEnglishName = (displayName: string) =>
    Object.keys(MAP_TRANSLATIONS).find((key) => MAP_TRANSLATIONS[key] === displayName) || displayName;

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
