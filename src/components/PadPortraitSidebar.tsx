/**
 * PadPortraitSidebar - 组件层
 *
 * 模块定位：
 * - 所在层级：组件层
 * - 主要目标：承载界面渲染与事件分发
 *
 * 关键职责：
 * - 聚焦界面渲染与交互事件回调
 * - 接收上层 props 并输出稳定 UI 行为
 * - 避免在组件中堆积跨模块业务逻辑
 *
 * 主要导出：
 * - `default:PadPortraitSidebar`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`../types/lineup`
 * - 下游影响：供页面与应用壳组合
 */

import React from 'react';
import type { AgentOption, MapOption } from '../types/lineup';

type Props = {
  selectedMap: MapOption | null;
  selectedAgent: AgentOption | null;
  agents: AgentOption[];
  agentCounts?: Record<string, number>;
  getMapDisplayName: (name: string) => string;
  onMapClick: () => void;
  onSelectAgent: (agent: AgentOption) => void;
  className?: string;
};

function PadPortraitSidebar({
  selectedMap,
  selectedAgent,
  agents,
  agentCounts,
  getMapDisplayName,
  onMapClick,
  onSelectAgent,
  className = '',
}: Props) {
  const mapThumbSrc = selectedMap?.displayIcon || '/logo.svg';
  const mapName = selectedMap?.displayName ? getMapDisplayName(selectedMap.displayName) : '地图';

  return (
    <aside
      className={`absolute left-0 top-0 bottom-0 z-20 w-[70px] border-r border-white/10 bg-black/60 backdrop-blur-md px-1.5 pt-2 pb-2 flex flex-col gap-1.5 shadow-2xl ${className}`.trim()}
    >
      <div className="w-full aspect-square rounded-lg overflow-hidden border border-[#ff4655] bg-[#ff4655] p-1">
        <img src="/logo.svg" alt="ValPoint" className="w-full h-full object-contain" />
      </div>

      <button
        onClick={onMapClick}
        className="group relative w-full aspect-square rounded-lg overflow-hidden border border-white/15 bg-[#0f1923]/90 hover:border-[#ff4655] transition-colors"
        title={`选择地图：${mapName}`}
      >
        <img
          src={mapThumbSrc}
          alt={mapName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/logo.svg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        <span className="absolute left-1 right-1 bottom-1 text-[9px] leading-none font-semibold text-white truncate text-center">
          {mapName}
        </span>
      </button>

      <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 space-y-1">
        {agents.map((agent) => {
          const key = agent.uuid || agent.displayName;
          const count = agentCounts?.[agent.displayName] || 0;
          const isSelected = selectedAgent?.uuid
            ? selectedAgent.uuid === agent.uuid
            : selectedAgent?.displayName === agent.displayName;

          return (
            <button
              key={key}
              onClick={() => onSelectAgent(agent)}
              className={`group relative w-full aspect-square rounded-lg overflow-hidden border transition-all ${isSelected
                ? 'border-[#ff4655] ring-1 ring-[#ff4655]/50'
                : 'border-white/10 hover:border-white/30'
                }`}
              title={agent.displayName}
            >
              <img
                src={agent.displayIcon || `/agents/${agent.displayName}.webp`}
                alt={agent.displayName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/agents/default.webp';
                }}
              />
              {count > 0 && (
                <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 rounded-bl-lg rounded-tr-lg text-[11px] leading-[18px] font-semibold bg-[#ff4655] text-white shadow">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export default PadPortraitSidebar;
