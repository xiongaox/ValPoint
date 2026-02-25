/**
 * maps - 常量层
 *
 * 模块定位：
 * - 所在层级：常量层
 * - 主要目标：集中管理映射与静态常量
 *
 * 关键职责：
 * - 维护集中常量与映射表
 * - 避免魔法字符串散落在业务代码
 * - 为多处逻辑提供统一配置来源
 *
 * 主要导出：
 * - `CUSTOM_MAP_URLS`、`MAP_TRANSLATIONS`
 *
 * 依赖关系：
 * - 上游依赖：无显式外部模块依赖
 * - 下游影响：供业务逻辑与渲染读取
 */

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
};
