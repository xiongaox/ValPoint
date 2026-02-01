/**
 * MobileAgentPicker - 移动端英雄选择器
 *
 * 职责：
 * - 渲染移动端英雄选择器相关的界面结构与样式。
 * - 处理用户交互与状态变更并触发回调。
 * - 组合子组件并提供可配置项。
 */

import React from 'react';
import Icon from './Icon';
import { AgentOption } from '../types/lineup';
import { useEscapeClose } from '../hooks/useEscapeClose';

interface MobileAgentPickerProps {
    isOpen: boolean;
    onClose: () => void;
    agents: AgentOption[];
    selectedAgent: AgentOption | null;
    onSelect: (agent: AgentOption | null) => void;
    agentCounts?: Record<string, number>;
}

function MobileAgentPicker({
    isOpen,
    onClose,
    agents,
    selectedAgent,
    onSelect,
    agentCounts
}: MobileAgentPickerProps) {
    useEscapeClose(isOpen, onClose);

    if (!isOpen) return null;

    const handleSelect = (agent: AgentOption) => {
        onSelect(agent);
        onClose();
    };

    return (
        <>
            <div
                className="fixed inset-0 bg-black/60 z-[1000] animate-in fade-in duration-200"
                onClick={onClose}
            />

            <div className="fixed bottom-0 left-0 right-0 z-[1001] bg-[#1f2326] rounded-t-2xl animate-in slide-in-from-bottom duration-300 max-h-[70vh] flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <h3 className="text-white font-semibold">选择角色</h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white"
                    >
                        <Icon name="X" size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3">
                    <div className="grid grid-cols-5 gap-2">
                        {agents.map((agent) => {
                            const count = agentCounts?.[agent.displayName] || 0;
                            const isSelected = selectedAgent?.displayName === agent.displayName;

                            return (
                                <button
                                    key={agent.displayName}
                                    onClick={() => handleSelect(agent)}
                                    className={`relative flex flex-col items-center p-2 rounded-lg transition-all ${isSelected
                                        ? 'bg-[#ff4655] ring-2 ring-[#ff4655]'
                                        : 'bg-white/5 hover:bg-white/10'
                                        }`}
                                >
                                    <img
                                        src={encodeURI(agent.displayIcon || `/agents/${agent.displayName}.png`)}
                                        alt={agent.displayName}
                                        className="w-10 h-10 rounded-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            if (!target.src.includes('default')) {
                                                target.src = '/agents/default.png';
                                            }
                                        }}
                                    />
                                    <span className="text-xs text-white mt-1 truncate w-full text-center">
                                        {agent.displayName}
                                    </span>
                                    {count > 0 && (
                                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#ff4655] text-white text-xs rounded-full flex items-center justify-center px-1">
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}

export default MobileAgentPicker;
