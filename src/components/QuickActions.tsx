// @ts-nocheck
/**
 * QuickActions - 悬浮快捷功能菜单
 * 
 * 位于界面右下角，提供：
 * - 核心功能入口（跳转个人信息、图床配置、高级设置、修改密码等）
 * - 批量下载功能
 * - 后台同步状态展示（针对管理员）
 * - 待审点位提醒（针对用户）
 */
import React from 'react';
import Icon from './Icon';

type Props = {
  isOpen: boolean;
  onToggle: () => void;
  onImageBedConfig: () => void;
  onChangePassword: () => void;
  onClearLineups: () => void;
  onAdvancedSettings: () => void;
  onSyncToShared?: () => void;  // 同步到共享库（管理员）
  onPendingSubmissions?: () => void;  // 待审点位（普通用户）
  onBatchDownload?: () => void; // 批量下载
  onProfile?: () => void;       // 个人信息
  isAdmin?: boolean;             // 是否管理员
  pendingTransfers?: number;
};

const QuickActions: React.FC<Props> = ({
  isOpen,
  onToggle,
  onImageBedConfig,
  onChangePassword,
  onClearLineups,
  onAdvancedSettings,
  onSyncToShared,
  onPendingSubmissions,
  onBatchDownload,
  onProfile,
  isAdmin = false,
  pendingTransfers = 0,
}) => {
  const showProgress = pendingTransfers > 0;
  return (
    <div className="absolute bottom-4 right-4 z-30 pointer-events-none">
      <div className="relative flex items-center gap-3 pointer-events-none">
        {showProgress && (
          <div className="flex items-center gap-2 bg-[#0d1117]/90 border border-white/10 rounded-2xl shadow-lg px-3 py-2 h-12 min-w-[140px] backdrop-blur-sm pointer-events-auto">
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 rounded-full border-[4px] border-[#ff6b6b]/30" />
              <div className="absolute inset-0 rounded-full border-[4px] border-t-transparent border-l-transparent border-[#ff4655] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-[12px] font-extrabold text-white drop-shadow">
                {pendingTransfers}
              </div>
            </div>
            <div className="flex flex-col leading-tight -space-y-0.5">
              <span className="text-[12px] text-gray-100 font-semibold">后台同步</span>
              <span className="text-[11px] text-gray-500">请勿关闭当前网页</span>
            </div>
          </div>
        )}
        <div className="relative pointer-events-auto flex flex-col items-center gap-4">
          {/* 批量下载按钮 - 显示在同步按钮上方 */}
          {onBatchDownload && (
            <button
              onClick={onBatchDownload}
              className="w-12 h-12 rounded-full bg-[#2a2f38] hover:bg-[#3a4048] text-white flex items-center justify-center shadow-lg border border-white/10 transition-colors"
              title="批量下载当前点位"
            >
              <Icon name="Download" size={20} />
            </button>
          )}

          {/* 同步到共享库按钮 - 仅管理员显示 */}
          {isAdmin && onSyncToShared && (
            <button
              onClick={onSyncToShared}
              className="w-12 h-12 rounded-full bg-[#2a2f38] hover:bg-[#3a4048] text-white flex items-center justify-center shadow-lg border border-white/10 transition-colors"
              title="同步到共享库"
            >
              <Icon name="Share2" size={20} />
            </button>
          )}

          {/* 待审点位按钮 - 仅普通用户显示 */}
          {!isAdmin && onPendingSubmissions && (
            <button
              onClick={onPendingSubmissions}
              className="w-12 h-12 rounded-full bg-[#f59e0b] hover:bg-[#d97706] text-white flex items-center justify-center shadow-lg border border-white/10 transition-colors"
              title="待审点位"
            >
              <Icon name="Clock" size={20} />
            </button>
          )}

          {isOpen && (
            <div className="absolute bottom-14 right-0 bg-[#11161c] border border-white/15 rounded-2xl shadow-2xl p-3 w-44 space-y-2 backdrop-blur">
              <div className="text-[11px] text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Icon name="Settings" size={12} /> 快捷功能
              </div>
              <button
                onClick={onImageBedConfig}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[13px] text-white border border-white/10 transition-colors"
              >
                <span className="flex items-center gap-1.5"><Icon name="Image" size={14} /> 图床配置</span>
                <Icon name="ChevronRight" size={12} className="text-gray-400" />
              </button>
              <button
                onClick={onAdvancedSettings}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[13px] text-white border border-white/10 transition-colors"
              >
                <span className="flex items-center gap-1.5"><Icon name="SlidersHorizontal" size={14} /> 高级设置</span>
                <Icon name="ChevronRight" size={12} className="text-gray-400" />
              </button>
              {onProfile && (
                <button
                  onClick={onProfile}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[13px] text-white border border-white/10 transition-colors"
                >
                  <span className="flex items-center gap-1.5"><Icon name="User" size={14} /> 个人信息</span>
                  <Icon name="ChevronRight" size={12} className="text-gray-400" />
                </button>
              )}
            </div>
          )}
          <button
            onClick={onToggle}
            className="w-12 h-12 rounded-full bg-[#ff4655] hover:bg-[#d93a49] text-white flex items-center justify-center shadow-lg shadow-red-900/40 border border-white/10 transition-colors"
            title="快捷功能"
          >
            <Icon name={isOpen ? 'X' : 'Menu'} size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
