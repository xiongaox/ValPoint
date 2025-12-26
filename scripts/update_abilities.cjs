const fs = require('fs');
const path = require('path');

// 读取localAgents.ts文件
const localAgentsPath = path.join(__dirname, 'src', 'data', 'localAgents.ts');
let localAgentsContent = fs.readFileSync(localAgentsPath, 'utf8');

// UUID到中文名称的映射表（角色）
const agentMap = {
  'e370fa57-4757-3604-3648-499e1f642d3f': '盖可',
  'dade69b4-4f5a-8528-247b-219e5a1facd6': '黑梦',
  '5f8d3a7f-467b-97f3-062c-13acf203c006': '铁臂',
  'cc8b64c8-4b25-4ff9-6e7f-37b4da43d235': '钢锁',
  'b444168c-4e35-8076-db47-ef9bf368f384': '钛狐',
  'f94c3b30-42be-e959-889c-5aa313dba261': '雷兹',
  '22697a3d-45bf-8dd7-4fec-84a9e28c69d7': '尚勃勒',
  '601dbbe7-43ce-be57-2a40-4abd24953621': 'KO',
  '6f2a04ca-43e0-be17-7f36-b3908627744d': '斯凯',
  '117ed9e3-49f3-6512-3ccf-0cada7e3823b': '零',
  '320b2a48-4d9b-a075-30f1-1f93a9b638fa': '猎枭',
  '1e58de9c-4950-5125-93e9-a0aee9f98746': '奇乐',
  '95b78ed7-4637-86d9-7e41-71ba8c293152': '海神',
  'efba5359-4016-a1e5-7626-b1ae76895940': '维斯',
  '707eab51-4836-f488-046a-cda6bf494859': '蝰蛇',
  'eb93336a-449b-9c1b-0a54-a891f7921d69': '不死鸟',
  '92eeef5d-43b5-1d4a-8d03-b3927a09034b': '禁灭',
  '41fb69c1-4189-7b37-f117-bcaf1e96f1bf': '星礈',
  '9f0d8ba9-4140-b941-57d3-a7ad57c6b417': '炼狱',
  '0e38b510-41a8-5780-5e8f-568b2a4f2d6c': '壹决',
  '1dbf2edd-4729-0984-3115-daa5eed44993': '暮蝶',
  'bb2a4828-46eb-8cd1-e765-15848195d751': '霓虹',
  '7f94d92c-4234-0a36-9646-3a87eb8b5c89': '夜露',
  'df1cb487-4902-002e-5c17-d28e83e78588': '幻棱',
  '569fdd95-4d10-43ab-ca70-79becc718b46': '贤者',
  'a3bfb853-43b2-7238-a4f1-ad90e9e46bcc': '芮娜',
  '8e253930-4c05-31dd-1b6c-968525494517': '幽影',
  'add6443a-41bd-e414-f6ad-e58d267f4e95': '捷风'
};

// 技能槽位到中文的映射
const slotMap = {
  'Ability1': '技能1',
  'Ability2': '技能2',
  'Grenade': '手雷',
  'Ultimate': '大招',
  'Passive': '被动'
};

// 角色技能映射表
const abilityMap = {
  // 盖可
  'e370fa57-4757-3604-3648-499e1f642d3f': {
    'Ability1': '顽皮搭档',
    'Ability2': '炫晕光波',
    'Grenade': '嗨爆全场',
    'Ultimate': '无敌超鲨'
  },
  // 黑梦
  'dade69b4-4f5a-8528-247b-219e5a1facd6': {
    'Ability1': '幽爪',
    'Ability2': '诡眼',
    'Grenade': '黯兽',
    'Ultimate': '夜临'
  },
  // 铁臂
  '5f8d3a7f-467b-97f3-062c-13acf203c006': {
    'Ability1': '闪点爆破',
    'Ability2': '山崩地陷',
    'Grenade': '剧震余波',
    'Ultimate': '惊雷卷地'
  },
  // 钢锁
  'cc8b64c8-4b25-4ff9-6e7f-37b4da43d235': {
    'Ability1': '声感陷阱',
    'Ability2': '重力捕网',
    'Grenade': '阻域屏障',
    'Ultimate': '断魂索道'
  },
  // 钛狐
  'b444168c-4e35-8076-db47-ef9bf368f384': {
    'Ability1': '特快专递',
    'Ability2': '精准投放',
    'Grenade': '潜袭爬虫',
    'Ultimate': '末日审判'
  },
  // 雷兹
  'f94c3b30-42be-e959-889c-5aa313dba261': {
    'Ability1': '惊喜翻腾',
    'Ability2': '彩雷飞溅',
    'Grenade': '花车巡游',
    'Ultimate': '晚安焰火'
  },
  // 尚勃勒
  '22697a3d-45bf-8dd7-4fec-84a9e28c69d7': {
    'Ability1': '金牌猎头',
    'Ability2': '闪转自如',
    'Grenade': '贵宾限行',
    'Ultimate': '孤高火力'
  },
  // KO
  '601dbbe7-43ce-be57-2a40-4abd24953621': {
    'Ability1': '闪存过载',
    'Ability2': '零点嗅探',
    'Grenade': '碎片溢出',
    'Ultimate': '无效命令'
  },
  // 斯凯
  '6f2a04ca-43e0-be17-7f36-b3908627744d': {
    'Ability1': '辟林之虎',
    'Ability2': '引路之隼',
    'Grenade': '愈生之息',
    'Ultimate': '追猎之灵'
  },
  // 零
  '117ed9e3-49f3-6512-3ccf-0cada7e3823b': {
    'Ability1': '赛博囚笼',
    'Ability2': '战术监控',
    'Grenade': '震慑绊线',
    'Ultimate': '神经取析'
  },
  // 猎枭
  '320b2a48-4d9b-a075-30f1-1f93a9b638fa': {
    'Ability1': '雷击箭',
    'Ability2': '寻敌箭',
    'Grenade': '枭型无人机',
    'Ultimate': '狂猎之怒',
    'Passive': '诡秘神射手'
  },
  // 奇乐
  '1e58de9c-4950-5125-93e9-a0aee9f98746': {
    'Ability1': '自动哨兵',
    'Ability2': '哨戒炮台',
    'Grenade': '纳米蜂群',
    'Ultimate': '全面封锁'
  },
  // 海神
  '95b78ed7-4637-86d9-7e41-71ba8c293152': {
    'Ability1': '狂潮',
    'Ability2': '海盾',
    'Grenade': '乱涌',
    'Ultimate': '怒涛'
  },
  // 维斯
  'efba5359-4016-a1e5-7626-b1ae76895940': {
    'Ability1': '裁断',
    'Ability2': '弧光玫瑰',
    'Grenade': '剃刀藤蔓',
    'Ultimate': '铁棘禁园'
  },
  // 蝰蛇
  '707eab51-4836-f488-046a-cda6bf494859': {
    'Ability1': '瘴云',
    'Ability2': '毒幕',
    'Grenade': '蛇吻',
    'Ultimate': '蝰腹',
    'Passive': '毒素'
  },
  // 不死鸟
  'eb93336a-449b-9c1b-0a54-a891f7921d69': {
    'Ability1': '火热手感',
    'Ability2': '闪光曲球',
    'Grenade': '火冒三丈',
    'Ultimate': '再火一回',
    'Passive': '热度上升'
  },
  // 禁灭
  '92eeef5d-43b5-1d4a-8d03-b3927a09034b': {
    'Ability1': '裂变残片',
    'Ability2': '噬源体',
    'Grenade': '涡流折跃',
    'Ultimate': '完全进化'
  },
  // 星礈
  '41fb69c1-4189-7b37-f117-bcaf1e96f1bf': {
    'Ability1': '新星脉冲',
    'Ability2': '星云/消散',
    'Grenade': '重力之阱',
    'Ultimate': '星界形态/宇宙分裂',
    'Passive': '星界形态'
  },
  // 炼狱
  '9f0d8ba9-4140-b941-57d3-a7ad57c6b417': {
    'Ability1': '燃烧榴弹',
    'Ability2': '空投烟幕',
    'Grenade': '振奋信标',
    'Ultimate': '天基光束'
  },
  // 壹决
  '0e38b510-41a8-5780-5e8f-568b2a4f2d6c': {
    'Ability1': '稳态剥离',
    'Ability2': '战斗心流',
    'Grenade': '绝对屏障',
    'Ultimate': '决斗通牒'
  },
  // 暮蝶
  '1dbf2edd-4729-0984-3115-daa5eed44993': {
    'Ability1': '整蛊',
    'Ability2': '霞染',
    'Grenade': '虹吸',
    'Ultimate': '化蝶'
  },
  // 霓虹
  'bb2a4828-46eb-8cd1-e765-15848195d751': {
    'Ability1': '闪电弹球',
    'Ability2': '充能疾驰',
    'Grenade': '高速通道',
    'Ultimate': '超限暴走'
  },
  // 夜露
  '7f94d92c-4234-0a36-9646-3a87eb8b5c89': {
    'Ability1': '攻其不备',
    'Ability2': '不请自来',
    'Grenade': '出其不意',
    'Ultimate': '神鬼不觉'
  },
  // 幻棱
  'df1cb487-4902-002e-5c17-d28e83e78588': {
    'Ability1': '光速飞跃',
    'Ability2': '溯流回光',
    'Grenade': '光棱闪爆',
    'Ultimate': '时光修罗场'
  },
  // 贤者
  '569fdd95-4d10-43ab-ca70-79becc718b46': {
    'Ability1': '薄冰',
    'Ability2': '逢春',
    'Grenade': '玉城',
    'Ultimate': '再起'
  },
  // 芮娜
  'a3bfb853-43b2-7238-a4f1-ad90e9e46bcc': {
    'Ability1': '噬尽',
    'Ability2': '逐散',
    'Grenade': '睥睨',
    'Ultimate': '女皇旨令'
  },
  // 幽影
  '8e253930-4c05-31dd-1b6c-968525494517': {
    'Ability1': '暗魇',
    'Ability2': '黑瘴',
    'Grenade': '践影',
    'Ultimate': '离魂'
  },
  // 捷风
  'add6443a-41bd-e414-f6ad-e58d267f4e95': {
    'Ability1': '凌空',
    'Ability2': '逐风',
    'Grenade': '瞬云',
    'Ultimate': '飓刃',
    'Passive': '飘移'
  }
};

// 使用正则表达式匹配并替换技能的displayIcon路径
Object.keys(agentMap).forEach(uuid => {
  const roleName = agentMap[uuid];
  const abilities = abilityMap[uuid];
  
  if (abilities) {
    Object.keys(abilities).forEach(slot => {
      const slotName = slotMap[slot] || slot;
      const abilityName = abilities[slot];
      
      // 处理文件名中的特殊字符，如斜杠等
      const sanitizedAbilityName = abilityName.replace(/\//g, '-');
      
      // 构建旧的和新的路径
      const oldPathPattern = new RegExp(`("/abilities/${uuid}-${slot}\\.png")`, 'g');
      const newPath = `"/abilities/${roleName}-${slotName}-${sanitizedAbilityName}.png"`;
      
      // 替换路径
      localAgentsContent = localAgentsContent.replace(oldPathPattern, newPath);
    });
  }
});

// 写入更新后的内容到文件
fs.writeFileSync(localAgentsPath, localAgentsContent, 'utf8');
console.log('localAgents.ts文件中的技能displayIcon路径已更新完成');