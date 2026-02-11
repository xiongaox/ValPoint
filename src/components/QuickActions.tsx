/**
 * QuickActions - 快捷操作
 *
 * 职责：
 * - 渲染快捷操作相关的界面结构与样式。
 * - 处理用户交互与状态变更并触发回调。
 * - 组合子组件并提供可配置项。
 */

import React from 'react';
import Icon, { IconName } from './Icon';

type Props = {
  isOpen: boolean;
  onToggle: () => void;
  onImageBedConfig: () => void;
  onChangePassword: () => void;
  onClearLineups: () => void;
  onAdvancedSettings: () => void;
  onPngSettings?: () => void; // 说明：图片处理设置。
  onSyncToShared?: () => void; // 说明：同步到共享库（管理员）。
  onPendingSubmissions?: () => void; // 说明：待审点位（普通用户）。
  onBatchDownload?: () => void; // 说明：批量下载。
  onProfile?: () => void; // 说明：个人信息设置。
  isAdmin?: boolean; // 说明：管理员标记。
  pendingTransfers?: number;
  canBatchDownload?: boolean; // 说明：允许批量下载。
  mode?: 'default' | 'pad'; // 说明：pad 模式仅保留核心入口。
  sizeMode?: 'default' | 'pad'; // 说明：仅控制按钮视觉尺寸。
};

const ActionButton = ({
  onClick,
  icon,
  title,
  color = "bg-[#2a2f38]",
  isPadMode = false,
}: {
  onClick: () => void,
  icon: IconName,
  title: string,
  color?: string,
  isPadMode?: boolean,
}) => (
  <div className="flex items-center gap-3 animate-in slide-in-from-bottom-2 fade-in duration-200">
    <div className="px-2 py-1 bg-[#11161c] border border-white/10 rounded-md text-xs text-gray-300 shadow-lg whitespace-nowrap">
      {title}
    </div>
    <button
      onClick={onClick}
      className={`${isPadMode ? 'w-14 h-14' : 'w-12 h-12'} rounded-full ${color} hover:brightness-110 text-white flex items-center justify-center shadow-lg border border-white/10 transition-all active:scale-95`}
      title={title}
    >
      <Icon name={icon} size={isPadMode ? 24 : 20} />
    </button>
  </div>
);

const QuickActions: React.FC<Props> = ({
  isOpen,
  onToggle,
  onImageBedConfig,
  onChangePassword,
  onClearLineups,
  onAdvancedSettings,
  onPngSettings,
  onSyncToShared,
  onPendingSubmissions,
  onBatchDownload,
  onProfile,
  isAdmin = false,
  pendingTransfers = 0,
  canBatchDownload = false,
  mode = 'default',
  sizeMode,
}) => {
  const isPadMode = mode === 'pad';
  const isPadSize = (sizeMode ?? mode) === 'pad';
  const showProgress = !isPadMode && pendingTransfers > 0;
  return (
    <div className={`absolute bottom-4 ${isPadMode ? 'right-2' : 'right-4'} z-30 pointer-events-none`}>
      <div className="relative flex items-end flex-col gap-3 pointer-events-none">

        {showProgress && (
          <div className="flex items-center gap-2 bg-[#0d1117]/90 border border-white/10 rounded-2xl shadow-lg px-3 py-2 h-12 min-w-[140px] backdrop-blur-sm pointer-events-auto mb-2">
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

        <div className="pointer-events-auto flex flex-col items-end gap-3 button-list">
          {isOpen && (
            <>
              {onProfile && (
                <ActionButton onClick={onProfile} icon="User" title="个人信息" isPadMode={isPadSize} />
              )}

              {!isPadMode && !isAdmin && onPendingSubmissions && (
                <ActionButton onClick={onPendingSubmissions} icon="Clock" title="待审点位" isPadMode={isPadSize} />
              )}

              {!isPadMode && isAdmin && onSyncToShared && (
                <ActionButton onClick={onSyncToShared} icon="Share2" title="同步到共享库" isPadMode={isPadSize} />
              )}

              {!isPadMode && onBatchDownload && canBatchDownload && (
                <ActionButton onClick={onBatchDownload} icon="Download" title="批量下载" isPadMode={isPadSize} />
              )}

              <ActionButton onClick={onAdvancedSettings} icon="SlidersHorizontal" title="高级设置" isPadMode={isPadSize} />

              <ActionButton onClick={onChangePassword} icon="Key" title="修改密码" isPadMode={isPadSize} />

              {!isPadMode && onPngSettings && (
                <ActionButton onClick={onPngSettings} icon="FileImage" title="PNG转换" isPadMode={isPadSize} />
              )}

              {!isPadMode && (
                <ActionButton onClick={onImageBedConfig} icon="Image" title="图床配置" isPadMode={isPadSize} />
              )}
            </>
          )}

          <div className="flex items-center gap-3">
            {isOpen && !isPadMode && (
              <button
                onClick={() => window.open('/reticle.html', '_blank')}
                className="w-12 h-12 rounded-full bg-[#2a2f38] hover:bg-[#3a4048] text-white flex items-center justify-center shadow-lg border border-white/10 transition-all active:scale-95 animate-in slide-in-from-right-2 fade-in duration-200"
                title="瞄点编辑器"
              >
                <Icon name="Crosshair" size={20} />
              </button>
            )}

            <button
              onClick={onToggle}
              className={`${isPadSize ? 'w-14 h-14' : 'w-12 h-12'} rounded-full text-white flex items-center justify-center shadow-lg border border-white/10 transition-all duration-300 z-40 ${isOpen ? 'bg-[#2a2f38] rotate-90' : 'bg-[#ff4655] hover:bg-[#d93a49] shadow-red-900/40'
                }`}
              title="快捷功能"
            >
              <Icon name={isOpen ? 'X' : 'Menu'} size={isPadSize ? 26 : 22} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
