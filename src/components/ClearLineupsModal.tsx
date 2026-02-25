/**
 * ClearLineupsModal - 组件层
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
 * - `default:ClearLineupsModal`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`./Icon`、`../hooks/useEscapeClose`
 * - 下游影响：供页面与应用壳组合
 */

import React from 'react';
import Icon from './Icon';
import { useEscapeClose } from '../hooks/useEscapeClose';

type Props = {
  isOpen: boolean;
  selectedAgentName: string | null;
  selectedAgentIcon: string | null;
  onClose: () => void;
  onClearAll: () => void;
  onClearSelectedAgent: () => void;
};

const ClearLineupsModal: React.FC<Props> = ({
  isOpen,
  selectedAgentName,
  selectedAgentIcon,
  onClose,
  onClearAll,
  onClearSelectedAgent,
}) => {
  useEscapeClose(isOpen, onClose);

  if (!isOpen) return null;

  const renderAvatar = () => {
    if (selectedAgentIcon) {
      return <img src={selectedAgentIcon} alt={selectedAgentName || '当前英雄'} className="w-16 h-16 rounded-full object-cover" />;
    }
    return (
      <div className="w-16 h-16 rounded-full bg-gray-700/80 border border-white/10 flex items-center justify-center text-gray-300">
        <Icon name="User" size={24} />
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="relative bg-gradient-to-b from-[#1c2228] to-[#11161b] border border-white/10 rounded-2xl shadow-2xl max-w-[520px] w-full p-7 space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ff4655]/20 text-[#ff4655] flex items-center justify-center">
              <Icon name="AlertTriangle" size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">清空点位</h3>
              <p className="text-sm text-gray-400">此操作不可恢复，请选择清空范围。</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/40 transition-colors"
            aria-label="关闭"
          >
            <Icon name="X" size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-5
         justify-items-center">
          <button
            onClick={onClearAll}
            className="group w-[220px] h-full rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors p-4 flex flex-col items-center gap-3 text-white"
          >
            <div className="w-20 h-20 rounded-full bg-[#ff4655]/15 border border-[#ff4655]/30 flex items-center justify-center">
              <img src="/logo.svg" alt="清空所有点位" className="w-14 h-14 object-contain" />
            </div>
            <div className="text-center space-y-1">
              <div className="text-base font-semibold">清空所有点位</div>
              <p className="text-xs text-gray-400 leading-tight">删除当前账号的全部点位</p>
            </div>
          </button>

          <button
            onClick={onClearSelectedAgent}
            className="group w-[220px] h-full rounded-2xl border border-amber-400/40 bg-amber-500/10 hover:bg-amber-500/15 transition-colors p-4 flex flex-col items-center gap-3 text-amber-50"
          >
            <div className="w-20 h-20 rounded-full bg-black/20 border border-amber-400/50 flex items-center justify-center overflow-hidden">
              {renderAvatar()}
            </div>
            <div className="text-center space-y-1">
              <div className="text-base font-semibold">清空当前英雄点位</div>
              <p className="text-xs text-amber-200/90 leading-tight">
                {selectedAgentName ? `当前：${selectedAgentName}` : '未选择英雄'}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClearLineupsModal;
