/**
 * maps - 地图
 *
 * 职责：
 * - 集中管理地图相关的配置与常量。
 * - 为其他模块提供统一的参数来源。
 * - 支持不同环境或场景的可配置性。
 */

import type { MapPoolStatus } from '../types/lineup';

export const CUSTOM_MAP_URLS = {
  Ascent: {
    attack: "/maps/attack/攻方-亚海悬城(Ascent).svg",
    defense: "/maps/defense/守方-亚海悬城(Ascent).svg",
  },
  Breeze: {
    attack: "/maps/attack/攻方-微风岛屿(Breeze).svg",
    defense: "/maps/defense/守方-微风岛屿(Breeze).svg",
  },
  Sunset: {
    attack: "/maps/attack/攻方-日落之城(Sunset).svg",
    defense: "/maps/defense/守方-日落之城(Sunset).svg",
  },
  Icebox: {
    attack: "/maps/attack/攻方-森寒冬港(Icebox).svg",
    defense: "/maps/defense/守方-森寒冬港(Icebox).svg",
  },
  Pearl: {
    attack: "/maps/attack/攻方-深海明珠(Pearl).svg",
    defense: "/maps/defense/守方-深海明珠(Pearl).svg",
  },
  Bind: {
    attack: "/maps/attack/攻方-源工重镇(Bind).svg",
    defense: "/maps/defense/守方-源工重镇(Bind).svg",
  },
  Lotus: {
    attack: "/maps/attack/攻方-莲华古城(Lotus).svg",
    defense: "/maps/defense/守方-莲华古城(Lotus).svg",
  },
  Fracture: {
    attack: "/maps/attack/攻方-裂变峡谷(Fracture).svg",
    defense: "/maps/defense/守方-裂变峡谷(Fracture).svg",
  },
  Haven: {
    attack: "/maps/attack/攻方-隐世修所(Haven).svg",
    defense: "/maps/defense/守方-隐世修所(Haven).svg",
  },
  Split: {
    attack: "/maps/attack/攻方-霓虹町(Split).svg",
    defense: "/maps/defense/守方-霓虹町(Split).svg",
  },
  Abyss: {
    attack: "/maps/attack/攻方-幽邃地窟(Abyss).svg",
    defense: "/maps/defense/守方-幽邃地窟(Abyss).svg",
  },
  Corrode: {
    attack: "/maps/attack/攻方-盐海矿镇(Corrode).svg",
    defense: "/maps/defense/守方-盐海矿镇(Corrode).svg",
  },
  Summit: {
    attack: "/maps/attack/攻方-天枢云阙(Summit).svg",
    defense: "/maps/defense/守方-天枢云阙(Summit).svg",
  },
};

export const MAP_TRANSLATIONS: Record<string, string> = {
  Ascent: "亚海悬城",
  Bind: "源工重镇",
  Breeze: "微风岛屿",
  Fracture: "裂变峡谷",
  Haven: "隐世修所",
  Icebox: "森寒冬港",
  Lotus: "莲华古城",
  Pearl: "深海明珠",
  Split: "霓虹町",
  Sunset: "日落之城",
  Abyss: "幽邃地窟",
  Corrode: "盐海矿镇",
  Summit: "天枢云阙",
};

/** 英文地图名 -> 中文显示名（未收录则原样返回） */
export const translateMapName = (en: string): string => MAP_TRANSLATIONS[en] || en;

/** 中文显示名 -> 英文地图名（未收录则原样返回） */
export const mapNameToEnglish = (displayName: string): string =>
  Object.keys(MAP_TRANSLATIONS).find((key) => MAP_TRANSLATIONS[key] === displayName) || displayName;

/** 地图池状态角标：状态 -> 显示文字、背景色 */
export const POOL_STATUS_CONFIG: Record<MapPoolStatus, { label: string; className: string }> = {
  'in-pool': { label: '在池', className: 'bg-emerald-500/90' },
  'returning': { label: '回归', className: 'bg-blue-500/90' },
  'rotated-out': { label: '轮出', className: 'bg-red-500/90' },
  'new': { label: '新增', className: 'bg-violet-600/90' },
};
