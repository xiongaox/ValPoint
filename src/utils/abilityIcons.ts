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
  KO: {
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

  // 英文名同样预置，避免缺漏
  // //炼狱
  // Brimstone: {
  //   iconRedirect: {
  //     Ability1: 'Ability1',
  //     Ability2: 'Ability2',
  //     Grenade: 'Grenade',
  //     Ultimate: 'Ultimate',
  //   }
  // },
  // //不死鸟
  // Phoenix: {
  //   iconRedirect: {
  //     Ability1: 'Ability2',
  //     Ability2: 'Ability1',
  //     Grenade: 'Grenade',
  //     Ultimate: 'Ultimate',
  //   }
  // },
  // //贤者
  // Sage: {
  //   iconRedirect: {
  //     Ability1: 'Grenade',
  //     Ability2: 'Ability1',
  //     Grenade: 'Ability2',
  //     Ultimate: 'Ultimate',
  //   }
  // },
  // //猎枭
  // Sova: {
  //   iconRedirect: {
  //     Ability1: 'Grenade',
  //     Ability2: 'Ability1',
  //     Grenade: 'Ability2',
  //     Ultimate: 'Ultimate',
  //   }
  // },
  // //蝰蛇
  // Viper: {
  //   iconRedirect: {
  //     Ability1: 'Grenade',
  //     Ability2: 'Ability1',
  //     Grenade: 'Ability2',
  //     Ultimate: 'Ultimate',
  //   }
  // },
  // //零
  // Cypher: {
  //   iconRedirect: {
  //     Ability1: 'Grenade',
  //     Ability2: 'Ability1',
  //     Grenade: 'Ability2',
  //     Ultimate: 'Ultimate',
  //   }
  // },
  // //芮娜
  // Reyna: {
  //   iconRedirect: {
  //     Ability1: 'Grenade',
  //     Ability2: 'Ability1',
  //     Grenade: 'Ability2',
  //     Ultimate: 'Ultimate',
  //   }
  // },
  // //奇乐
  // Killjoy: {
  //   iconRedirect: {
  //     Ability1: 'Ability1',
  //     Ability2: 'Ability2',
  //     Grenade: 'Grenade',
  //     Ultimate: 'Ultimate',
  //   }
  // },
  // //雷兹
  // Raze: {
  //   iconRedirect: {
  //     Ability1: 'Grenade',
  //     Ability2: 'Ability1',
  //     Grenade: 'Ability2',
  //     Ultimate: 'Ultimate',
  //   }
  // },
  // //铁臂
  // Breach: {
  //   iconRedirect: {
  //     Ability1: 'Grenade',
  //     Ability2: 'Ability1',
  //     Grenade: 'Ability2',
  //     Ultimate: 'Ultimate',
  //   }
  // },
  // //幽影
  // Omen: {
  //   iconRedirect: {
  //     Ability1: 'Grenade',
  //     Ability2: 'Ability1',
  //     Grenade: 'Ability2',
  //     Ultimate: 'Ultimate',
  //   }
  // },
  // //捷风
  // Jett: {
  //   iconRedirect: {
  //     Ability1: 'Grenade',
  //     Ability2: 'Ability1',
  //     Grenade: 'Ability2',
  //     Ultimate: 'Ultimate',
  //   }
  // },
  // //斯凯
  // Skye: {
  //   iconRedirect: {
  //     Ability1: 'Grenade',
  //     Ability2: 'Ability1',
  //     Grenade: 'Ability2',
  //     Ultimate: 'Ultimate',
  //   }
  // },
  // //夜露
  // Yoru: {
  //   iconRedirect: {
  //     Ability1: 'Ability1',
  //     Ability2: 'Ability2',
  //     Grenade: 'Grenade',
  //     Ultimate: 'Ultimate',
  //   }
  // },
  // //星礈
  // Astra: {
  //   iconRedirect: {
  //     Ability1: 'Grenade',
  //     Ability2: 'Ability1',
  //     Grenade: 'Ability2',
  //     Ultimate: 'Ultimate',
  //   }
  // },
  // //KO
  // KAYO: {
  //   iconRedirect: {
  //     Ability1: 'Ability1',
  //     Ability2: 'Ability2',
  //     Grenade: 'Grenade',
  //     Ultimate: 'Ultimate',
  //   }
  // },
  // //尚勃勒
  // Chamber: {
  //   iconRedirect: {
  //     Ability1: 'Ability2',
  //     Ability2: 'Grenade',
  //     Grenade: 'Ability1',
  //     Ultimate: 'Ultimate',
  //   }
  // },
  // //霓虹
  // Neon: {
  //   iconRedirect: {
  //     Ability1: 'Ability1',
  //     Ability2: 'Grenade',
  //     Grenade: 'Ability2',
  //     Ultimate: 'Ultimate',
  //   }
  // },
  // //黑梦
  // Fade: {
  //   iconRedirect: {
  //     Ability1: 'Grenade',
  //     Ability2: 'Ability1',
  //     Grenade: 'Ability2',
  //     Ultimate: 'Ultimate',
  //   }
  // },
  // //海神
  // Harbor: {
  //   iconRedirect: {
  //     Ability1: 'Grenade',
  //     Ability2: 'Ability2',
  //     Grenade: 'Ability1',
  //     Ultimate: 'Ultimate',
  //   }
  // },
  // //盖可
  // Gekko: {
  //   iconRedirect: {
  //     Ability1: 'Ability1',
  //     Ability2: 'Ability2',
  //     Grenade: 'Grenade',
  //     Ultimate: 'Ultimate',
  //   }
  // },
  // //钢锁
  // Deadlock: {
  //   iconRedirect: {
  //     Ability1: 'Grenade',
  //     Ability2: 'Ability2',
  //     Grenade: 'Ability1',
  //     Ultimate: 'Ultimate',
  //   }
  // },
  // //壹决
  // Iso: {
  //   iconRedirect: {
  //     Ability1: 'Grenade',
  //     Ability2: 'Ability2',
  //     Grenade: 'Ultimate',
  //     Ultimate: 'Ability1',
  //   }
  // },
  // //暮蝶
  // Clove: {
  //   iconRedirect: {
  //     Ability1: 'Ultimate',
  //     Ability2: 'Ability1',
  //     Grenade: 'Grenade',
  //     Ultimate: 'Ability2',
  //   }
  // },
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
