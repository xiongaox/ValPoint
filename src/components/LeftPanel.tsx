// @ts-nocheck
import React from 'react';
import Icon from './Icon';
import { getAbilityIcon, getAbilityTitle } from '../utils/abilityIcons';

type Props = {
  activeTab: string;
  selectedMap: any;
  setIsMapModalOpen: (val: boolean) => void;
  selectedSide: string;
  setSelectedSide: (val: string) => void;
  selectedAgent: any;
  setSelectedAgent: (agent: any) => void;
  agents: any[];
  agentCounts: Record<string, number>;
  selectedAbilityIndex: number | null;
  setSelectedAbilityIndex: (idx: number | null) => void;
  setIsPreviewModalOpen: (v: boolean) => void;
  getMapDisplayName: (name: string) => string;
  openChangelog: () => void;
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
}) => {
  const handleAgentClick = (agent: any) => {
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
          </div>
          {selectedMap && (
            <div
              onClick={() => setIsMapModalOpen(true)}
              className="group relative h-28 w-full rounded-lg overflow-hidden border border-white/20 cursor-pointer hover:border-[#ff4655] transition-all shadow-lg"
            >
              <img src={selectedMap.listViewIcon} alt={selectedMap.displayName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end p-4">
                <span className="font-bold text-xl uppercase tracking-widest text-white drop-shadow-md">{getMapDisplayName(selectedMap.displayName)}</span>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">选择特工 (Agent)</label>
            {activeTab === 'view' && selectedAgent && (
              <button onClick={() => setSelectedAgent(null)} className="text-[12px] text-gray-500 hover:text-white">显示全部</button>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {agents.map((agent) => {
              const count = agentCounts[agent.displayName] || 0;
              return (
                <div
                  key={agent.uuid}
                  onClick={() => handleAgentClick(agent)}
                  className={`agent-item aspect-square rounded cursor-pointer overflow-hidden relative border-2 ${selectedAgent?.uuid === agent.uuid ? 'selected border-[#ff4655]' : 'border-transparent bg-[#0f1923]'}`}
                  title={agent.displayName}
                >
                  <img src={agent.displayIcon} alt={agent.displayName} className="w-full h-full object-cover" />
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
                .filter((a: any) => a.slot !== 'Passive')
                .map((ability: any, idx: number) => (
                  <button
                    key={idx}
                  onClick={() => setSelectedAbilityIndex(selectedAbilityIndex === idx ? null : idx)}
                  className={`ability-icon flex flex-col items-center gap-1 flex-1 p-1 rounded ${selectedAbilityIndex === idx ? 'selected bg-white/5' : ''}`}
                  title={getAbilityTitle(selectedAgent, ability.slot, ability.displayName)}
                >
                  <img src={getAbilityIcon(selectedAgent, idx)} className="w-8 h-8 object-contain" />
                  <span className="text-[10px] uppercase font-bold text-gray-500">
                    技能：{['C', 'Q', 'E', 'X'][idx] || ability.slot}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeftPanel;
