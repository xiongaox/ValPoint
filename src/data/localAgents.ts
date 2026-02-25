/**
 * localAgents - 数据层
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
 * - `LOCAL_AGENTS`
 *
 * 依赖关系：
 * - 上游依赖：`../types/lineup`
 * - 下游影响：供工具与业务层读取
 */

import { AgentData } from '../types/lineup';

export const LOCAL_AGENTS: AgentData[] = [
  {
    "displayName": "盖可",
    "displayIcon": "/agents/盖可.png",
    "uuid": "e370fa57-4757-3604-3648-499e1f642d3f",
    "abilities": [
      {
        "slot": "Ability1",
        "displayIcon": "/abilities/盖可-顽皮搭档.png",
        "displayName": "顽皮搭档"
      },
      {
        "slot": "Ability2",
        "displayIcon": "/abilities/盖可-炫晕光波.png",
        "displayName": "炫晕光波"
      },
      {
        "slot": "Grenade",
        "displayIcon": "/abilities/盖可-嗨爆全场.png",
        "displayName": "嗨爆全场"
      },
      {
        "slot": "Ultimate",
        "displayIcon": "/abilities/盖可-无敌超鲨.png",
        "displayName": "无敌超鲨"
      }
    ]
  },
  {
    "displayName": "黑梦",
    "displayIcon": "/agents/黑梦.png",
    "uuid": "dade69b4-4f5a-8528-247b-219e5a1facd6",
    "abilities": [
      {
        "slot": "Ability1",
        "displayIcon": "/abilities/黑梦-幽爪.png",
        "displayName": "幽爪"
      },
      {
        "slot": "Ability2",
        "displayIcon": "/abilities/黑梦-诡眼.png",
        "displayName": "诡眼"
      },
      {
        "slot": "Grenade",
        "displayIcon": "/abilities/黑梦-黯兽.png",
        "displayName": "黯兽"
      },
      {
        "slot": "Ultimate",
        "displayIcon": "/abilities/黑梦-夜临.png",
        "displayName": "夜临"
      }
    ]
  },
  {
    "displayName": "铁臂",
    "displayIcon": "/agents/铁臂.png",
    "uuid": "5f8d3a7f-467b-97f3-062c-13acf203c006",
    "abilities": [
      {
        "slot": "Ability1",
        "displayIcon": "/abilities/铁臂-闪点爆破.png",
        "displayName": "闪点爆破"
      },
      {
        "slot": "Ability2",
        "displayIcon": "/abilities/铁臂-山崩地陷.png",
        "displayName": "山崩地陷"
      },
      {
        "slot": "Grenade",
        "displayIcon": "/abilities/铁臂-剧震余波.png",
        "displayName": "剧震余波"
      },
      {
        "slot": "Ultimate",
        "displayIcon": "/abilities/铁臂-惊雷卷地.png",
        "displayName": "惊雷卷地"
      }
    ]
  },
  {
    "displayName": "钢锁",
    "displayIcon": "/agents/钢锁.png",
    "uuid": "cc8b64c8-4b25-4ff9-6e7f-37b4da43d235",
    "abilities": [
      {
        "slot": "Ability1",
        "displayIcon": "/abilities/钢锁-声感陷阱.png",
        "displayName": "声感陷阱"
      },
      {
        "slot": "Grenade",
        "displayIcon": "/abilities/钢锁-阻域屏障.png",
        "displayName": "阻域屏障"
      },
      {
        "slot": "Ability2",
        "displayIcon": "/abilities/钢锁-重力捕网.png",
        "displayName": "重力捕网"
      },
      {
        "slot": "Ultimate",
        "displayIcon": "/abilities/钢锁-断魂索道.png",
        "displayName": "断魂索道"
      }
    ]
  },
  {
    "displayName": "钛狐",
    "displayIcon": "/agents/钛狐.png",
    "uuid": "b444168c-4e35-8076-db47-ef9bf368f384",
    "abilities": [
      {
        "slot": "Ability2",
        "displayIcon": "/abilities/钛狐-精准投放.png",
        "displayName": "精准投放"
      },
      {
        "slot": "Ability1",
        "displayIcon": "/abilities/钛狐-特快专递.png",
        "displayName": "特快专递"
      },
      {
        "slot": "Ultimate",
        "displayIcon": "/abilities/钛狐-末日审判.png",
        "displayName": "末日审判"
      },
      {
        "slot": "Grenade",
        "displayIcon": "/abilities/钛狐-潜袭爬虫.png",
        "displayName": "潜袭爬虫"
      }
    ]
  },
  {
    "displayName": "雷兹",
    "displayIcon": "/agents/雷兹.png",
    "uuid": "f94c3b30-42be-e959-889c-5aa313dba261",
    "abilities": [
      {
        "slot": "Ability1",
        "displayIcon": "/abilities/雷兹-惊喜翻腾.png",
        "displayName": "惊喜翻腾"
      },
      {
        "slot": "Ability2",
        "displayIcon": "/abilities/雷兹-彩雷飞溅.png",
        "displayName": "彩雷飞溅"
      },
      {
        "slot": "Grenade",
        "displayIcon": "/abilities/雷兹-花车巡游.png",
        "displayName": "花车巡游"
      },
      {
        "slot": "Ultimate",
        "displayIcon": "/abilities/雷兹-晚安焰火.png",
        "displayName": "晚安焰火"
      }
    ]
  },
  {
    "displayName": "尚勃勒",
    "displayIcon": "/agents/尚勃勒.png",
    "uuid": "22697a3d-45bf-8dd7-4fec-84a9e28c69d7",
    "abilities": [
      {
        "slot": "Ability2",
        "displayIcon": "/abilities/尚勃勒-闪转自如.png",
        "displayName": "闪转自如"
      },
      {
        "slot": "Grenade",
        "displayIcon": "/abilities/尚勃勒-贵宾限行.png",
        "displayName": "贵宾限行"
      },
      {
        "slot": "Ability1",
        "displayIcon": "/abilities/尚勃勒-金牌猎头.png",
        "displayName": "金牌猎头"
      },
      {
        "slot": "Ultimate",
        "displayIcon": "/abilities/尚勃勒-孤高火力.png",
        "displayName": "孤高火力"
      }
    ]
  },
  {
    "displayName": "K/O",
    "displayIcon": "/agents/KO.png",
    "uuid": "601dbbe7-43ce-be57-2a40-4abd24953621",
    "abilities": [
      {
        "slot": "Grenade",
        "displayIcon": "/abilities/KO-碎片溢出.png",
        "displayName": "碎片溢出"
      },
      {
        "slot": "Ability1",
        "displayIcon": "/abilities/KO-闪存过载.png",
        "displayName": "闪存过载"
      },
      {
        "slot": "Ability2",
        "displayIcon": "/abilities/KO-零点嗅探.png",
        "displayName": "零点嗅探"
      },
      {
        "slot": "Ultimate",
        "displayIcon": "/abilities/KO-无效命令.png",
        "displayName": "无效命令"
      }
    ]
  },
  {
    "displayName": "斯凯",
    "displayIcon": "/agents/斯凯.png",
    "uuid": "6f2a04ca-43e0-be17-7f36-b3908627744d",
    "abilities": [
      {
        "slot": "Ability1",
        "displayIcon": "/abilities/斯凯-辟林之虎.png",
        "displayName": "辟林之虎"
      },
      {
        "slot": "Ability2",
        "displayIcon": "/abilities/斯凯-引路之隼.png",
        "displayName": "引路之隼"
      },
      {
        "slot": "Grenade",
        "displayIcon": "/abilities/斯凯-愈生之息.png",
        "displayName": "愈生之息"
      },
      {
        "slot": "Ultimate",
        "displayIcon": "/abilities/斯凯-追猎之灵.png",
        "displayName": "追猎之灵"
      }
    ]
  },
  {
    "displayName": "零",
    "displayIcon": "/agents/零.png",
    "uuid": "117ed9e3-49f3-6512-3ccf-0cada7e3823b",
    "abilities": [
      {
        "slot": "Ability1",
        "displayIcon": "/abilities/零-赛博囚笼.png",
        "displayName": "赛博囚笼"
      },
      {
        "slot": "Ability2",
        "displayIcon": "/abilities/零-战术监控.png",
        "displayName": "战术监控"
      },
      {
        "slot": "Grenade",
        "displayIcon": "/abilities/零-震慑绊线.png",
        "displayName": "震慑绊线"
      },
      {
        "slot": "Ultimate",
        "displayIcon": "/abilities/零-神经取析.png",
        "displayName": "神经取析"
      }
    ]
  },
  {
    "displayName": "猎枭",
    "displayIcon": "/agents/猎枭.png",
    "uuid": "320b2a48-4d9b-a075-30f1-1f93a9b638fa",
    "abilities": [
      {
        "slot": "Ability1",
        "displayIcon": "/abilities/猎枭-雷击箭.png",
        "displayName": "雷击箭"
      },
      {
        "slot": "Ability2",
        "displayIcon": "/abilities/猎枭-寻敌箭.png",
        "displayName": "寻敌箭"
      },
      {
        "slot": "Grenade",
        "displayIcon": "/abilities/猎枭-枭型无人机.png",
        "displayName": "枭型无人机"
      },
      {
        "slot": "Ultimate",
        "displayIcon": "/abilities/猎枭-狂猎之怒.png",
        "displayName": "狂猎之怒"
      },
      {
        "slot": "Passive",
        "displayIcon": "/abilities/猎枭-诡秘神射手.png",
        "displayName": "诡秘神射手"
      }
    ]
  },
  {
    "displayName": "奇乐",
    "displayIcon": "/agents/奇乐.png",
    "uuid": "1e58de9c-4950-5125-93e9-a0aee9f98746",
    "abilities": [
      {
        "slot": "Grenade",
        "displayIcon": "/abilities/奇乐-纳米蜂群.png",
        "displayName": "纳米蜂群"
      },
      {
        "slot": "Ability1",
        "displayIcon": "/abilities/奇乐-自动哨兵.png",
        "displayName": "自动哨兵"
      },
      {
        "slot": "Ability2",
        "displayIcon": "/abilities/奇乐-哨戒炮台.png",
        "displayName": "哨戒炮台"
      },
      {
        "slot": "Ultimate",
        "displayIcon": "/abilities/奇乐-全面封锁.png",
        "displayName": "全面封锁"
      }
    ]
  },
  {
    "displayName": "海神",
    "displayIcon": "/agents/海神.png",
    "uuid": "95b78ed7-4637-86d9-7e41-71ba8c293152",
    "abilities": [
      {
        "slot": "Ability1",
        "displayIcon": "/abilities/海神-狂潮.png",
        "displayName": "狂潮"
      },
      {
        "slot": "Grenade",
        "displayIcon": "/abilities/海神-乱涌.png",
        "displayName": "乱涌"
      },
      {
        "slot": "Ability2",
        "displayIcon": "/abilities/海神-海盾.png",
        "displayName": "海盾"
      },
      {
        "slot": "Ultimate",
        "displayIcon": "/abilities/海神-怒涛.png",
        "displayName": "怒涛"
      }
    ]
  },
  {
    "displayName": "维斯",
    "displayIcon": "/agents/维斯.png",
    "uuid": "efba5359-4016-a1e5-7626-b1ae76895940",
    "abilities": [
      {
        "slot": "Ability1",
        "displayIcon": "/abilities/维斯-裁断.png",
        "displayName": "裁断"
      },
      {
        "slot": "Ability2",
        "displayIcon": "/abilities/维斯-弧光玫瑰.png",
        "displayName": "弧光玫瑰"
      },
      {
        "slot": "Grenade",
        "displayIcon": "/abilities/维斯-剃刀藤蔓.png",
        "displayName": "剃刀藤蔓"
      },
      {
        "slot": "Ultimate",
        "displayIcon": "/abilities/维斯-铁棘禁园.png",
        "displayName": "铁棘禁园"
      }
    ]
  },
  {
    "displayName": "蝰蛇",
    "displayIcon": "/agents/蝰蛇.png",
    "uuid": "707eab51-4836-f488-046a-cda6bf494859",
    "abilities": [
      {
        "slot": "Ability1",
        "displayIcon": "/abilities/蝰蛇-瘴云.png",
        "displayName": "瘴云"
      },
      {
        "slot": "Ability2",
        "displayIcon": "/abilities/蝰蛇-毒幕.png",
        "displayName": "毒幕"
      },
      {
        "slot": "Grenade",
        "displayIcon": "/abilities/蝰蛇-蛇吻.png",
        "displayName": "蛇吻"
      },
      {
        "slot": "Ultimate",
        "displayIcon": "/abilities/蝰蛇-蝰腹.png",
        "displayName": "蝰腹"
      },
      {
        "slot": "Passive",
        "displayIcon": "/abilities/蝰蛇-毒素.png",
        "displayName": "毒素"
      }
    ]
  },
  {
    "displayName": "不死鸟",
    "displayIcon": "/agents/不死鸟.png",
    "uuid": "eb93336a-449b-9c1b-0a54-a891f7921d69",
    "abilities": [
      {
        "slot": "Grenade",
        "displayIcon": "/abilities/不死鸟-火冒三丈.png",
        "displayName": "火冒三丈"
      },
      {
        "slot": "Ability1",
        "displayIcon": "/abilities/不死鸟-火热手感.png",
        "displayName": "火热手感"
      },
      {
        "slot": "Ability2",
        "displayIcon": "/abilities/不死鸟-闪光曲球.png",
        "displayName": "闪光曲球"
      },
      {
        "slot": "Ultimate",
        "displayIcon": "/abilities/不死鸟-再火一回.png",
        "displayName": "再火一回"
      },
      {
        "slot": "Passive",
        "displayIcon": "/abilities/不死鸟-热度上升.png",
        "displayName": "热度上升"
      }
    ]
  },
  {
    "displayName": "禁灭",
    "displayIcon": "/agents/禁灭.png",
    "uuid": "92eeef5d-43b5-1d4a-8d03-b3927a09034b",
    "abilities": [
      {
        "slot": "Ability2",
        "displayIcon": "/abilities/禁灭-噬源体.png",
        "displayName": "噬源体"
      },
      {
        "slot": "Grenade",
        "displayIcon": "/abilities/禁灭-涡流折跃.png",
        "displayName": "涡流折跃"
      },
      {
        "slot": "Ultimate",
        "displayIcon": "/abilities/禁灭-完全进化.png",
        "displayName": "完全进化"
      },
      {
        "slot": "Ability1",
        "displayIcon": "/abilities/禁灭-裂变残片.png",
        "displayName": "裂变残片"
      }
    ]
  },
  {
    "displayName": "星礈",
    "displayIcon": "/agents/星礈.png",
    "uuid": "41fb69c1-4189-7b37-f117-bcaf1e96f1bf",
    "abilities": [
      {
        "slot": "Ability1",
        "displayIcon": "/abilities/星礈-新星脉冲.png",
        "displayName": "新星脉冲"
      },
      {
        "slot": "Ability2",
        "displayIcon": "/abilities/星礈-星云-消散.png",
        "displayName": "星云/消散"
      },
      {
        "slot": "Grenade",
        "displayIcon": "/abilities/星礈-重力之阱.png",
        "displayName": "重力之阱"
      },
      {
        "slot": "Ultimate",
        "displayIcon": "/abilities/星礈-星界形态-宇宙分裂.png",
        "displayName": "星界形态/宇宙分裂"
      },
      {
        "slot": "Passive",
        "displayIcon": "/abilities/星礈-星界形态.png",
        "displayName": "星界形态"
      }
    ]
  },
  {
    "displayName": "炼狱",
    "displayIcon": "/agents/炼狱.png",
    "uuid": "9f0d8ba9-4140-b941-57d3-a7ad57c6b417",
    "abilities": [
      {
        "slot": "Grenade",
        "displayIcon": "/abilities/炼狱-振奋信标.png",
        "displayName": "振奋信标"
      },
      {
        "slot": "Ability1",
        "displayIcon": "/abilities/炼狱-燃烧榴弹.png",
        "displayName": "燃烧榴弹"
      },
      {
        "slot": "Ability2",
        "displayIcon": "/abilities/炼狱-空投烟幕.png",
        "displayName": "空投烟幕"
      },
      {
        "slot": "Ultimate",
        "displayIcon": "/abilities/炼狱-天基光束.png",
        "displayName": "天基光束"
      }
    ]
  },
  {
    "displayName": "壹决",
    "displayIcon": "/agents/壹决.png",
    "uuid": "0e38b510-41a8-5780-5e8f-568b2a4f2d6c",
    "abilities": [
      {
        "slot": "Ability1",
        "displayIcon": "/abilities/壹决-稳态剥离.png",
        "displayName": "稳态剥离"
      },
      {
        "slot": "Ultimate",
        "displayIcon": "/abilities/壹决-决斗通牒.png",
        "displayName": "决斗通牒"
      },
      {
        "slot": "Ability2",
        "displayIcon": "/abilities/壹决-战斗心流.png",
        "displayName": "战斗心流"
      },
      {
        "slot": "Grenade",
        "displayIcon": "/abilities/壹决-绝对屏障.png",
        "displayName": "绝对屏障"
      }
    ]
  },
  {
    "displayName": "暮蝶",
    "displayIcon": "/agents/暮蝶.png",
    "uuid": "1dbf2edd-4729-0984-3115-daa5eed44993",
    "abilities": [
      {
        "slot": "Grenade",
        "displayIcon": "/abilities/暮蝶-虹吸.png",
        "displayName": "虹吸"
      },
      {
        "slot": "Ability2",
        "displayIcon": "/abilities/暮蝶-霞染.png",
        "displayName": "霞染"
      },
      {
        "slot": "Ultimate",
        "displayIcon": "/abilities/暮蝶-化蝶.png",
        "displayName": "化蝶"
      },
      {
        "slot": "Ability1",
        "displayIcon": "/abilities/暮蝶-整蛊.png",
        "displayName": "整蛊"
      }
    ]
  },
  {
    "displayName": "霓虹",
    "displayIcon": "/agents/霓虹.png",
    "uuid": "bb2a4828-46eb-8cd1-e765-15848195d751",
    "abilities": [
      {
        "slot": "Ability2",
        "displayIcon": "/abilities/霓虹-充能疾驰.png",
        "displayName": "充能疾驰"
      },
      {
        "slot": "Ability1",
        "displayIcon": "/abilities/霓虹-闪电弹球.png",
        "displayName": "闪电弹球"
      },
      {
        "slot": "Grenade",
        "displayIcon": "/abilities/霓虹-高速通道.png",
        "displayName": "高速通道"
      },
      {
        "slot": "Ultimate",
        "displayIcon": "/abilities/霓虹-超限暴走.png",
        "displayName": "超限暴走"
      }
    ]
  },
  {
    "displayName": "夜露",
    "displayIcon": "/agents/夜露.png",
    "uuid": "7f94d92c-4234-0a36-9646-3a87eb8b5c89",
    "abilities": [
      {
        "slot": "Grenade",
        "displayIcon": "/abilities/夜露-出其不意.png",
        "displayName": "出其不意"
      },
      {
        "slot": "Ability1",
        "displayIcon": "/abilities/夜露-攻其不备.png",
        "displayName": "攻其不备"
      },
      {
        "slot": "Ability2",
        "displayIcon": "/abilities/夜露-不请自来.png",
        "displayName": "不请自来"
      },
      {
        "slot": "Ultimate",
        "displayIcon": "/abilities/夜露-神鬼不觉.png",
        "displayName": "神鬼不觉"
      }
    ]
  },
  {
    "displayName": "幻棱",
    "displayIcon": "/agents/幻棱.png",
    "uuid": "df1cb487-4902-002e-5c17-d28e83e78588",
    "abilities": [
      {
        "slot": "Ability2",
        "displayIcon": "/abilities/幻棱-溯流回光.png",
        "displayName": "溯流回光"
      },
      {
        "slot": "Grenade",
        "displayIcon": "/abilities/幻棱-光棱闪爆.png",
        "displayName": "光棱闪爆"
      },
      {
        "slot": "Ability1",
        "displayIcon": "/abilities/幻棱-光速飞跃.png",
        "displayName": "光速飞跃"
      },
      {
        "slot": "Ultimate",
        "displayIcon": "/abilities/幻棱-时光修罗场.png",
        "displayName": "时光修罗场"
      }
    ]
  },
  {
    "displayName": "贤者",
    "displayIcon": "/agents/贤者.png",
    "uuid": "569fdd95-4d10-43ab-ca70-79becc718b46",
    "abilities": [
      {
        "slot": "Ability1",
        "displayIcon": "/abilities/贤者-薄冰.png",
        "displayName": "薄冰"
      },
      {
        "slot": "Ability2",
        "displayIcon": "/abilities/贤者-逢春.png",
        "displayName": "逢春"
      },
      {
        "slot": "Grenade",
        "displayIcon": "/abilities/贤者-玉城.png",
        "displayName": "玉城"
      },
      {
        "slot": "Ultimate",
        "displayIcon": "/abilities/贤者-再起.png",
        "displayName": "再起"
      }
    ]
  },
  {
    "displayName": "芮娜",
    "displayIcon": "/agents/芮娜.png",
    "uuid": "a3bfb853-43b2-7238-a4f1-ad90e9e46bcc",
    "abilities": [
      {
        "slot": "Ability1",
        "displayIcon": "/abilities/芮娜-噬尽.png",
        "displayName": "噬尽"
      },
      {
        "slot": "Ability2",
        "displayIcon": "/abilities/芮娜-逐散.png",
        "displayName": "逐散"
      },
      {
        "slot": "Grenade",
        "displayIcon": "/abilities/芮娜-睥睨.png",
        "displayName": "睥睨"
      },
      {
        "slot": "Ultimate",
        "displayIcon": "/abilities/芮娜-女皇旨令.png",
        "displayName": "女皇旨令"
      }
    ]
  },
  {
    "displayName": "幽影",
    "displayIcon": "/agents/幽影.png",
    "uuid": "8e253930-4c05-31dd-1b6c-968525494517",
    "abilities": [
      {
        "slot": "Ability1",
        "displayIcon": "/abilities/幽影-暗魇.png",
        "displayName": "暗魇"
      },
      {
        "slot": "Ability2",
        "displayIcon": "/abilities/幽影-黑瘴.png",
        "displayName": "黑瘴"
      },
      {
        "slot": "Grenade",
        "displayIcon": "/abilities/幽影-践影.png",
        "displayName": "践影"
      },
      {
        "slot": "Ultimate",
        "displayIcon": "/abilities/幽影-离魂.png",
        "displayName": "离魂"
      }
    ]
  },
  {
    "displayName": "捷风",
    "displayIcon": "/agents/捷风.png",
    "uuid": "add6443a-41bd-e414-f6ad-e58d267f4e95",
    "abilities": [
      {
        "slot": "Ability1",
        "displayIcon": "/abilities/捷风-凌空.png",
        "displayName": "凌空"
      },
      {
        "slot": "Ability2",
        "displayIcon": "/abilities/捷风-逐风.png",
        "displayName": "逐风"
      },
      {
        "slot": "Grenade",
        "displayIcon": "/abilities/捷风-瞬云.png",
        "displayName": "瞬云"
      },
      {
        "slot": "Ultimate",
        "displayIcon": "/abilities/捷风-飓刃.png",
        "displayName": "飓刃"
      },
      {
        "slot": "Passive",
        "displayIcon": "/abilities/捷风-飘移.png",
        "displayName": "飘移"
      }
    ]
  }
];
