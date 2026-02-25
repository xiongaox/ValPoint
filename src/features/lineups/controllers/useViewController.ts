/**
 * useViewController - Feature 控制器层
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
 * - `useViewController`
 *
 * 依赖关系：
 * - 上游依赖：`../../../types/app`、`../../../types/lineup`、`../lineupHelpers`
 * - 下游影响：供 feature 入口控制器组合
 */

import { ActiveTab } from '../../../types/app';
import { AgentOption, BaseLineup, MapOption, NewLineupForm, SharedLineup } from '../../../types/lineup';
import { createEmptyLineup } from '../lineupHelpers';

type Params = {
  isGuest: boolean;
  activeTab: ActiveTab;
  agents: AgentOption[];
  selectedAgent: AgentOption | null;
  selectedSide: 'all' | 'attack' | 'defense';
  setActiveTab: (tab: ActiveTab) => void;
  setPlacingType: (val: 'agent' | 'skill' | null) => void;
  setSelectedLineupId: React.Dispatch<React.SetStateAction<string | null>>;
  setViewingLineup: React.Dispatch<React.SetStateAction<BaseLineup | null>>;
  setEditingLineupId: React.Dispatch<React.SetStateAction<string | null>>;
  setNewLineupData: React.Dispatch<React.SetStateAction<NewLineupForm>>;
  setSelectedSide: React.Dispatch<React.SetStateAction<'all' | 'attack' | 'defense'>>;
  setSelectedAbilityIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setSelectedAgent: React.Dispatch<React.SetStateAction<AgentOption | null>> | ((agent: AgentOption | null) => void);
  fetchLineups: (userId: string | null) => Promise<void>;
  userId: string | null;
  setAlertMessage: (msg: string | null) => void;
  setSelectedMap: (map: MapOption | null) => void;
};

export function useViewController({
  isGuest,
  activeTab,
  agents,
  selectedAgent,
  selectedSide,
  setActiveTab,
  setPlacingType,
  setSelectedLineupId,
  setViewingLineup,
  setEditingLineupId,
  setNewLineupData,
  setSelectedSide,
  setSelectedAbilityIndex,
  setSelectedAgent,
  fetchLineups,
  userId,
  setAlertMessage,
}: Params) {
  const handleTabSwitch = (tab: ActiveTab) => {
    if (isGuest && tab === 'create') {
      setAlertMessage('游客模式仅支持查看，如需新增或编辑请设置密码进入登录模式');
      return;
    }
    setActiveTab(tab);
    setPlacingType(null);
    setSelectedLineupId(null);
    setViewingLineup(null);
    setEditingLineupId(null);
    if (tab !== 'shared') {
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) { }
    }
    if (tab === 'create') {
      setNewLineupData(createEmptyLineup());
      if (selectedSide === 'all') setSelectedSide('attack');
    } else if (tab === 'view') {
      setSelectedSide('all');
      setSelectedAbilityIndex(null);
      if (!selectedAgent) {
        const firstAgent = agents[0];
        if (firstAgent) setSelectedAgent(firstAgent);
      }
      fetchLineups(userId);
    }
  };

  const handlePreviewSubmit = async (): Promise<void> => {
    return;
  };

  return {
    handleTabSwitch,
    handlePreviewSubmit,
  };
}
