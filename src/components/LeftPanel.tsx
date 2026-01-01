/**
 * LeftPanel - 左侧面板
 *
 * 职责：
 * - 承载左侧面板相关信息与操作入口。
 * - 组织内部子模块的布局与显示状态。
 * - 向父级汇报用户操作或选择。
 */

import React from 'react';
import Icon from './Icon';
import { getAbilityIcon, getAbilityTitle } from '../utils/abilityIcons';
import { ActiveTab } from '../types/app';
import { Ability, AgentData, MapOption } from '../types/lineup';

type MapWithIcon = MapOption & { listViewIcon?: string | null };

type Props = {
  activeTab: ActiveTab;
  selectedMap: MapWithIcon | null;
  setIsMapModalOpen: (val: boolean) => void;
  selectedSide: 'all' | 'attack' | 'defense';
  setSelectedSide: (val: 'all' | 'attack' | 'defense') => void;
  selectedAgent: AgentData | null;
  setSelectedAgent: (agent: AgentData | null) => void;
  agents: AgentData[];
  agentCounts: Record<string, number>;
  selectedAbilityIndex: number | null;
  setSelectedAbilityIndex: (idx: number | null) => void;
  setIsPreviewModalOpen: (v: boolean) => void;
  getMapDisplayName: (name: string) => string;
  openChangelog: () => void;
  onReset?: () => void;
};

const LeftPanel: React.FC<Props> = ({
  activeTab,
  selectedMap,
  setIsMapModalOpen,
  selectedSide,
  setSelectedSide,
  selectedAgent,
  setSelectedAgent,
  agents,
  agentCounts,
  selectedAbilityIndex,
  setSelectedAbilityIndex,
  setIsPreviewModalOpen,
  getMapDisplayName,
  openChangelog,
  onReset,
}) => {
  const handleAgentClick = (agent: AgentData) => {
    if (selectedAgent?.uuid === agent.uuid) {
      if (activeTab === 'view') setSelectedAgent(null);
    } else {
      setSelectedAgent(agent);
      setSelectedAbilityIndex(null);
    }
  };

  return (
    <div className="w-80 flex-shrink-0 flex flex-col bg-[#1f2326] border-r border-white/10 z-20 shadow-2xl">
      <div className="h-16 flex items-center px-6 border-b border-white/5 bg-[#1f2326] shadow-sm flex justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src="/brand-logo.svg" alt="Logo" className="w-[168px] h-[32px]" />
        </div>
        <button
          onClick={openChangelog}
          className="px-3.5 py-2 rounded-lg border border-white/10 text-xs text-gray-200 hover:text-white hover:border-[#ff4655] hover:bg-[#ff4655]/10 transition-colors"
        >
          更新日志
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">当前地图 (Map)</label>
            {onReset && (
              <button
                onClick={onReset}
                className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors px-2 py-0.5 rounded hover:bg-white/10"
                title="重置为初始状态"
              >
                <Icon name="RotateCcw" size={12} />
                刷新页面
              </button>
            )}
          </div>
          {selectedMap && (
            <div
              onClick={() => setIsMapModalOpen(true)}
              className="group relative h-28 w-full rounded-lg overflow-hidden border border-white/20 cursor-pointer hover:border-[#ff4655] transition-all shadow-lg"
            >
              {(() => {
                const mapImageSrc: string | undefined =
                  typeof selectedMap.listViewIcon === 'string'
                    ? selectedMap.listViewIcon
                    : typeof selectedMap.displayIcon === 'string'
                      ? selectedMap.displayIcon
                      : undefined;
                return (
                  <img
                    src={mapImageSrc}
                    alt={selectedMap.displayName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                );
              })()}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end p-4">
                <span className="font-bold text-xl uppercase tracking-widest text-white drop-shadow-md">
                  {getMapDisplayName(selectedMap.displayName)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">选择特工 (Agent)</label>
            {activeTab === 'view' && selectedAgent && (
              <button onClick={() => setSelectedAgent(null)} className="text-[12px] text-gray-500 hover:text-white">
                显示全部
              </button>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {agents.map((agent) => {
              const count = agentCounts[agent.displayName] || 0;
              return (
                <div
                  key={agent.uuid || agent.displayName}
                  onClick={() => handleAgentClick(agent)}
                  className={`agent-item aspect-square rounded cursor-pointer overflow-hidden relative border-2 ${selectedAgent?.uuid === agent.uuid ? 'selected border-[#ff4655]' : 'border-transparent bg-[#0f1923]'
                    }`}
                  title={agent.displayName}
                >
                  <img src={agent.displayIcon || undefined} alt={agent.displayName} className="w-full h-full object-cover" />
                  {activeTab === 'view' && <span className={`count-badge ${count > 0 ? 'count-has-data' : 'count-empty'}`}>{count}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {selectedAgent && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">
              {activeTab === 'create' ? '选择使用技能 (Ability)' : '按技能筛选 (Filter by Ability)'}
            </label>
            <div className="flex gap-2 justify-between bg-[#0f1923] p-2 rounded-lg border border-white/10">
              {selectedAgent.abilities
                ?.filter((a: Ability) => (a.slot || '').toLowerCase() !== 'passive')
                .map((ability: Ability, idx: number) => {
                  const slotKey = ability?.keypad || ['C', 'Q', 'E', 'X'][idx];
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedAbilityIndex(selectedAbilityIndex === idx ? null : idx)}
                      className={`ability-icon flex flex-col items-center gap-1 flex-1 p-1 rounded ${selectedAbilityIndex === idx ? 'selected bg-white/5' : ''
                        }`}
                      title={getAbilityTitle(selectedAgent, slotKey || '', ability.displayName || ability.name)}
                    >
                      <img src={getAbilityIcon(selectedAgent, idx)} className="w-8 h-8 object-contain" />
                      <span className="text-[10px] uppercase font-bold text-gray-500">技能：{['C', 'Q', 'E', 'X'][idx] || slotKey}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeftPanel;
