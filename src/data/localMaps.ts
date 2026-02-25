/**
 * localMaps - 数据层
 *
 * 模块定位：
 * - 所在层级：数据层
 * - 主要目标：承载静态数据源
 *
 * 关键职责：
 * - 承载当前文件的核心实现逻辑
 * - 处理输入输出与边界行为
 * - 向上层提供稳定可复用能力
 *
 * 主要导出：
 * - `LOCAL_MAPS`
 *
 * 依赖关系：
 * - 上游依赖：`../types/lineup`
 * - 下游影响：供工具与业务层读取
 */

import { MapOption } from '../types/lineup';

export const LOCAL_MAPS: MapOption[] = [
  {
    "displayName": "Ascent",
    "displayIcon": "/maps/covers/亚海悬城.webp"
  },
  {
    "displayName": "Abyss",
    "displayIcon": "/maps/covers/幽邃地窟.webp"
  },
  {
    "displayName": "Split",
    "displayIcon": "/maps/covers/霓虹町.webp"
  },
  {
    "displayName": "Fracture",
    "displayIcon": "/maps/covers/裂变峡谷.webp"
  },
  {
    "displayName": "Bind",
    "displayIcon": "/maps/covers/源工重镇.webp"
  },
  {
    "displayName": "Breeze",
    "displayIcon": "/maps/covers/微风岛屿.webp"
  },
  {
    "displayName": "Lotus",
    "displayIcon": "/maps/covers/莲华古城.webp"
  },
  {
    "displayName": "Sunset",
    "displayIcon": "/maps/covers/日落之城.webp"
  },
  {
    "displayName": "Pearl",
    "displayIcon": "/maps/covers/深海明珠.webp"
  },
  {
    "displayName": "Icebox",
    "displayIcon": "/maps/covers/森寒冬港.webp"
  },
  {
    "displayName": "Corrode",
    "displayIcon": "/maps/covers/盐海矿镇.webp"
  },
  {
    "displayName": "Haven",
    "displayIcon": "/maps/covers/隐世修所.webp"
  }
];
