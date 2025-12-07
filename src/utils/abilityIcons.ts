// @ts-nocheck
// 统一技能图标映射：顺序/文案固定（Ability1、Ability2、Grenade、Ultimate），默认图标使用 API 的 displayIcon。
// 这里为所有英雄预置同样的模板映射，方便你逐个修改：
// iconRedirect: { Ability1: 'Ability1', Ability2: 'Ability2', Grenade: 'Grenade', Ultimate: 'Ultimate' }

type Ability = { slot: string; displayIcon?: string };
type Agent = { displayName?: string; abilities?: Ability[] };

type IconOverrides = {
  iconRedirect?: Record<string, string>;
  iconUrl?: Record<string, string>;
};

const makeDefaultMap = () => ({
  Ability1: 'Ability1',
  Ability2: 'Ability2',
  Grenade: 'Grenade',
  Ultimate: 'Ultimate',
});

// 国服（含常用中文译名）+ 英文名都预置同样的默认映射，便于修改
const OVERRIDES: Record<string, IconOverrides> = {
  // 国服译名
  炼狱: {
    iconRedirect: {
      Ability1: 'Ability1',
      Ability2: 'Ability2',
      Grenade: 'Grenade',
      Ultimate: 'Ultimate',
    }
  },
  不死鸟: {
    iconRedirect: {
      Ability1: 'Ability2',
      Ability2: 'Ability1',
      Grenade: 'Grenade',
      Ultimate: 'Ultimate',
    }
  },
  贤者: {
    iconRedirect: {
      Ability1: 'Grenade',
      Ability2: 'Ability1',
      Grenade: 'Ability2',
      Ultimate: 'Ultimate',
    }
  },
  猎枭: {
    iconRedirect: {
      Ability1: 'Grenade',
      Ability2: 'Ability1',
      Grenade: 'Ability2',
      Ultimate: 'Ultimate',
    }
  },
  蝰蛇: {
    iconRedirect: {
      Ability1: 'Grenade',
      Ability2: 'Ability1',
      Grenade: 'Ability2',
      Ultimate: 'Ultimate',
    }
  },
  零: {
    iconRedirect: {
      Ability1: 'Grenade',
      Ability2: 'Ability1',
      Grenade: 'Ability2',
      Ultimate: 'Ultimate',
    }
  },
  芮娜: {
    iconRedirect: {
      Ability1: 'Grenade',
      Ability2: 'Ability1',
      Grenade: 'Ability2',
      Ultimate: 'Ultimate',
    }
  },
  奇乐: {
    iconRedirect: {
      Ability1: 'Ability1',
      Ability2: 'Ability2',
      Grenade: 'Grenade',
      Ultimate: 'Ultimate',
    }
  },
  雷兹: {
    iconRedirect: {
      Ability1: 'Grenade',
      Ability2: 'Ability1',
      Grenade: 'Ability2',
      Ultimate: 'Ultimate',
    }
  },
  铁臂: {
    iconRedirect: {
      Ability1: 'Grenade',
      Ability2: 'Ability1',
      Grenade: 'Ability2',
      Ultimate: 'Ultimate',
    }
  },
  幽影: {
    iconRedirect: {
      Ability1: 'Grenade',
      Ability2: 'Ability1',
      Grenade: 'Ability2',
      Ultimate: 'Ultimate',
    }
  },
  捷风: {
    iconRedirect: {
      Ability1: 'Grenade',
      Ability2: 'Ability1',
      Grenade: 'Ability2',
      Ultimate: 'Ultimate',
    }
  },
  斯凯: {
    iconRedirect: {
      Ability1: 'Grenade',
      Ability2: 'Ability1',
      Grenade: 'Ability2',
      Ultimate: 'Ultimate',
    }
  },
  夜露: {
    iconRedirect: {
      Ability1: 'Ability1',
      Ability2: 'Ability2',
      Grenade: 'Grenade',
      Ultimate: 'Ultimate',
    }
  },
  星礈: {
    iconRedirect: {
      Ability1: 'Grenade',
      Ability2: 'Ability1',
      Grenade: 'Ability2',
      Ultimate: 'Ultimate',
    }
  },
  'K/O': {
    iconRedirect: {
      Ability1: 'Ability1',
      Ability2: 'Ability2',
      Grenade: 'Grenade',
      Ultimate: 'Ultimate',
    }
  },
  尚勃勒: {
    iconRedirect: {
      Ability1: 'Ability2',
      Ability2: 'Grenade',
      Grenade: 'Ability1',
      Ultimate: 'Ultimate',
    }
  },
  霓虹: {
    iconRedirect: {
      Ability1: 'Ability1',
      Ability2: 'Grenade',
      Grenade: 'Ability2',
      Ultimate: 'Ultimate',
    }
  },
  黑梦: {
    iconRedirect: {
      Ability1: 'Grenade',
      Ability2: 'Ability1',
      Grenade: 'Ability2',
      Ultimate: 'Ultimate',
    }
  },
  海神: {
    iconRedirect: {
      Ability1: 'Grenade',
      Ability2: 'Ability2',
      Grenade: 'Ability1',
      Ultimate: 'Ultimate',
    }
  },
  盖可: {
    iconRedirect: {
      Ability1: 'Grenade',
      Ability2: 'Ability2',
      Grenade: 'Ability1',
      Ultimate: 'Ultimate',
    }
  },
  钢锁: {
    iconRedirect: {
      Ability1: 'Grenade',
      Ability2: 'Ability2',
      Grenade: 'Ability1',
      Ultimate: 'Ultimate',
    }
  },
  壹决: {
    iconRedirect: {
      Ability1: 'Grenade',
      Ability2: 'Ability2',
      Grenade: 'Ultimate',
      Ultimate: 'Ability1',
    }
  },
  暮蝶: {
    iconRedirect: {
      Ability1: 'Ultimate',
      Ability2: 'Ability1',
      Grenade: 'Grenade',
      Ultimate: 'Ability2',
    }
  },
  维斯: {
    iconRedirect: {
      Ability1: 'Grenade',
      Ability2: 'Ability1',
      Grenade: 'Ability2',
      Ultimate: 'Ultimate',
    }
  },
  钛狐: {
    iconRedirect: {
      Ability1: 'Ability1',
      Ability2: 'Grenade',
      Grenade: 'Ultimate',
      Ultimate: 'Ability2',
    }
  },
  幻棱: {
    iconRedirect: {
      Ability1: 'Ability2',
      Ability2: 'Grenade',
      Grenade: 'Ability1',
      Ultimate: 'Ultimate',
    }
  },
  禁灭: {
    iconRedirect: {
      Ability1: 'Ultimate',
      Ability2: 'Grenade',
      Grenade: 'Ability1',
      Ultimate: 'Ability2',
    }
  },
};

const normalizeAgentKey = (agent: Agent) => agent?.displayName || '';

export const getAbilityList = (agent: Agent) => {
  if (!agent?.abilities) return [];
  return agent.abilities.filter((a: Ability) => a.slot !== 'Passive');
};

export const getAbilityIcon = (agent: Agent, abilityIndex: number | null) => {
  if (!agent || abilityIndex === null || abilityIndex === undefined) return null;
  const list = getAbilityList(agent);
  const ability = list[abilityIndex];
  if (!ability) return null;

  const key = normalizeAgentKey(agent);
  const override = OVERRIDES[key];
  const slot = ability.slot;

  if (override?.iconUrl?.[slot]) return override.iconUrl[slot];

  const redirectSlot = override?.iconRedirect?.[slot];
  if (redirectSlot) {
    const redirected = list.find((a: Ability) => a.slot === redirectSlot);
    if (redirected?.displayIcon) return redirected.displayIcon;
  }

  return ability.displayIcon || null;
};

// ===== Title 占位配置（为所有已列出的英雄生成示例，便于手工修改）=====
const DEFAULT_TITLES = {
  Ability1: 'Ability1',
  Ability2: 'Ability2',
  Grenade: 'Grenade',
  Ultimate: 'Ultimate',
};

const TITLE_OVERRIDES: Record<string, Record<string, string>> = Object.fromEntries(
  Object.keys(OVERRIDES).map((key) => [key, { ...DEFAULT_TITLES }]),
);
  TITLE_OVERRIDES['炼狱'] = {
    Ability1: '技能Q的标题',
    Ability2: '技能E的标题',
    Grenade: '技能C的标题',
    Ultimate: '技能X的标题',
  };
  TITLE_OVERRIDES['不死鸟'] = {
    Ability1: '技能Q的标题',
    Ability2: '技能E的标题',
    Grenade: '技能C的标题',
    Ultimate: '技能X的标题',
  };
  TITLE_OVERRIDES['贤者'] = {
    Ability1: '技能Q的标题',
    Ability2: '技能E的标题',
    Grenade: '技能C的标题',
    Ultimate: '技能X的标题',
  };
  TITLE_OVERRIDES['猎枭'] = {
    Ability1: '技能Q的标题',
    Ability2: '技能E的标题',
    Grenade: '技能C的标题',
    Ultimate: '技能X的标题',
  };
  TITLE_OVERRIDES['蝰蛇'] = {
    Ability1: '技能Q的标题',
    Ability2: '技能E的标题',
    Grenade: '技能C的标题',
    Ultimate: '技能X的标题',
  };
  TITLE_OVERRIDES['零'] = {
    Ability1: '技能Q的标题',
    Ability2: '技能E的标题',
    Grenade: '技能C的标题',
    Ultimate: '技能X的标题',
  };
  TITLE_OVERRIDES['芮娜'] = {
    Ability1: '技能Q的标题',
    Ability2: '技能E的标题',
    Grenade: '技能C的标题',
    Ultimate: '技能X的标题',
  };
  TITLE_OVERRIDES['奇乐'] = {
    Ability1: '技能Q的标题',
    Ability2: '技能E的标题',
    Grenade: '技能C的标题',
    Ultimate: '技能X的标题',
  };
  TITLE_OVERRIDES['雷兹'] = {
    Ability1: '技能Q的标题',
    Ability2: '技能E的标题',
    Grenade: '技能C的标题',
    Ultimate: '技能X的标题',
  };
  TITLE_OVERRIDES['铁臂'] = {
    Ability1: '技能Q的标题',
    Ability2: '技能E的标题',
    Grenade: '技能C的标题',
    Ultimate: '技能X的标题',
  };
  TITLE_OVERRIDES['幽影'] = {
    Ability1: '技能Q的标题',
    Ability2: '技能E的标题',
    Grenade: '技能C的标题',
    Ultimate: '技能X的标题',
  };
  TITLE_OVERRIDES['捷风'] = {
    Ability1: '技能Q的标题',
    Ability2: '技能E的标题',
    Grenade: '技能C的标题',
    Ultimate: '技能X的标题',
  };
  TITLE_OVERRIDES['斯凯'] = {
    Ability1: '技能Q的标题',
    Ability2: '技能E的标题',
    Grenade: '技能C的标题',
    Ultimate: '技能X的标题',
  };
  TITLE_OVERRIDES['夜露'] = {
    Ability1: '技能Q的标题',
    Ability2: '技能E的标题',
    Grenade: '技能C的标题',
    Ultimate: '技能X的标题',
  };
  TITLE_OVERRIDES['星礈'] = {
    Ability1: '技能Q的标题',
    Ability2: '技能E的标题',
    Grenade: '技能C的标题',
    Ultimate: '技能X的标题',
  };
  TITLE_OVERRIDES['K/O'] = {
    Ability1: '技能Q的标题',
    Ability2: '技能E的标题',
    Grenade: '技能C的标题',
    Ultimate: '技能X的标题',
  };
  TITLE_OVERRIDES['尚勃勒'] = {
    Ability1: '技能Q的标题',
    Ability2: '技能E的标题',
    Grenade: '技能C的标题',
    Ultimate: '技能X的标题',
  };
  TITLE_OVERRIDES['霓虹'] = {
    Ability1: '技能Q的标题',
    Ability2: '技能E的标题',
    Grenade: '技能C的标题',
    Ultimate: '技能X的标题',
  };
  TITLE_OVERRIDES['黑梦'] = {
    Ability1: '技能Q的标题',
    Ability2: '技能E的标题',
    Grenade: '技能C的标题',
    Ultimate: '技能X的标题',
  };
  TITLE_OVERRIDES['海神'] = {
    Ability1: '技能Q的标题',
    Ability2: '技能E的标题',
    Grenade: '技能C的标题',
    Ultimate: '技能X的标题',
  };
  TITLE_OVERRIDES['盖可'] = {
    Ability1: '技能Q的标题',
    Ability2: '技能E的标题',
    Grenade: '技能C的标题',
    Ultimate: '技能X的标题',
  };
  TITLE_OVERRIDES['钢锁'] = {
    Ability1: '技能Q的标题',
    Ability2: '技能E的标题',
    Grenade: '技能C的标题',
    Ultimate: '技能X的标题',
  };
  TITLE_OVERRIDES['壹决'] = {
    Ability1: '技能Q的标题',
    Ability2: '技能E的标题',
    Grenade: '技能C的标题',
    Ultimate: '技能X的标题',
  };
  TITLE_OVERRIDES['暮蝶'] = {
    Ability1: '技能Q的标题',
    Ability2: '技能E的标题',
    Grenade: '技能C的标题',
    Ultimate: '技能X的标题',
  };
  TITLE_OVERRIDES['维斯'] = {
    Ability1: '技能Q的标题',
    Ability2: '技能E的标题',
    Grenade: '技能C的标题',
    Ultimate: '技能X的标题',
  };
  TITLE_OVERRIDES['钛狐'] = {
    Ability1: '技能Q的标题',
    Ability2: '技能E的标题',
    Grenade: '技能C的标题',
    Ultimate: '技能X的标题',
  };
  TITLE_OVERRIDES['幻棱'] = {
    Ability1: '技能Q的标题',
    Ability2: '技能E的标题',
    Grenade: '技能C的标题',
    Ultimate: '技能X的标题',
  };
  TITLE_OVERRIDES['禁灭'] = {
    Ability1: '技能Q的标题',
    Ability2: '技能E的标题',
    Grenade: '技能C的标题',
    Ultimate: '技能X的标题',
  };
export const getAbilityTitle = (agent: Agent, slot: string, fallback?: string) => {
  const key = normalizeAgentKey(agent);
  return TITLE_OVERRIDES[key]?.[slot] || fallback || slot;
};
