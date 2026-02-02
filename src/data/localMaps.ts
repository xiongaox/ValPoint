/**
 * localMaps - local地图
 *
 * 职责：
 * - 承载local地图相关的模块实现。
 * - 组织内部依赖与导出接口。
 * - 为上层功能提供支撑。
 */

import { MapOption } from '../types/lineup';

export const LOCAL_MAPS: MapOption[] = [
  {
    "displayName": "Ascent",
    "displayIcon": "/maps/covers/亚海悬城.webp"
    // 无角标（下架太久）
  },
  {
    "displayName": "Abyss",
    "displayIcon": "/maps/covers/幽邃地窟.webp",
    "poolStatus": "in-pool"
  },
  {
    "displayName": "Split",
    "displayIcon": "/maps/covers/霓虹町.webp",
    "poolStatus": "in-pool"
  },
  {
    "displayName": "Fracture",
    "displayIcon": "/maps/covers/裂变峡谷.webp"
    // 无角标（下架太久）
  },
  {
    "displayName": "Bind",
    "displayIcon": "/maps/covers/源工重镇.webp",
    "poolStatus": "in-pool"
  },
  {
    "displayName": "Breeze",
    "displayIcon": "/maps/covers/微风岛屿.webp",
    "poolStatus": "returning"
  },
  {
    "displayName": "Lotus",
    "displayIcon": "/maps/covers/莲华古城.webp"
    // 无角标（下架太久）
  },
  {
    "displayName": "Sunset",
    "displayIcon": "/maps/covers/日落之城.webp",
    "poolStatus": "rotated-out"
  },
  {
    "displayName": "Pearl",
    "displayIcon": "/maps/covers/深海明珠.webp",
    "poolStatus": "in-pool"
  },
  {
    "displayName": "Icebox",
    "displayIcon": "/maps/covers/森寒冬港.webp"
    // 无角标（下架太久）
  },
  {
    "displayName": "Corrode",
    "displayIcon": "/maps/covers/盐海矿镇.webp",
    "poolStatus": "in-pool"
  },
  {
    "displayName": "Haven",
    "displayIcon": "/maps/covers/隐世修所.webp",
    "poolStatus": "in-pool"
  }
];
