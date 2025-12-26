
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
import Icon, { IconName } from './Icon';

type Props = {
  isOpen: boolean;
  onToggle: () => void;
  onImageBedConfig: () => void;
  onChangePassword: () => void;
  onClearLineups: () => void;
  onAdvancedSettings: () => void;
  onPngSettings?: () => void;  // 图片处理设置
  onSyncToShared?: () => void;  // 同步到共享库（管理员）
  onPendingSubmissions?: () => void;  // 待审点位（普通用户）
  onBatchDownload?: () => void; // 批量下载
  onProfile?: () => void;       // 个人信息
  isAdmin?: boolean;             // 是否管理员
  pendingTransfers?: number;
  canBatchDownload?: boolean;   // 是否允许批量下载
};

const ActionButton = ({ onClick, icon, title, color = "bg-[#2a2f38]" }: { onClick: () => void, icon: IconName, title: string, color?: string }) => (
  <div className="flex items-center gap-3 animate-in slide-in-from-bottom-2 fade-in duration-200">
    <div className="px-2 py-1 bg-[#11161c] border border-white/10 rounded-md text-xs text-gray-300 shadow-lg whitespace-nowrap">
      {title}
    </div>
    <button
      onClick={onClick}
      className={`w-12 h-12 rounded-full ${color} hover:brightness-110 text-white flex items-center justify-center shadow-lg border border-white/10 transition-all active:scale-95`}
      title={title}
    >
      <Icon name={icon} size={20} />
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
}) => {
  const showProgress = pendingTransfers > 0;
  return (
    <div className="absolute bottom-4 right-4 z-30 pointer-events-none">
      <div className="relative flex items-end flex-col gap-3 pointer-events-none">

        {/* 后台任务进度 - 始终显示 */}
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
          {/* 展开的功能按钮列表 */}
          {isOpen && (
            <>
              {/* 个人信息 */}
              {onProfile && (
                <ActionButton onClick={onProfile} icon="User" title="个人信息" />
              )}

              {/* 待审点位 (普通用户) */}
              {!isAdmin && onPendingSubmissions && (
                <ActionButton onClick={onPendingSubmissions} icon="Clock" title="待审点位" />
              )}

              {/* 同步到共享库 (管理员) */}
              {isAdmin && onSyncToShared && (
                <ActionButton onClick={onSyncToShared} icon="Share2" title="同步到共享库" />
              )}

              {/* 批量下载 */}
              {onBatchDownload && canBatchDownload && (
                <ActionButton onClick={onBatchDownload} icon="Download" title="批量下载" />
              )}

              {/* 高级设置 - 仅保留非核心的交互设置 */}
              <ActionButton onClick={onAdvancedSettings} icon="SlidersHorizontal" title="高级设置" />

              {/* 修改密码 */}
              <ActionButton onClick={onChangePassword} icon="Key" title="修改密码" />

              {/* PNG 转换 */}
              {onPngSettings && (
                <ActionButton onClick={onPngSettings} icon="FileImage" title="PNG转换" />
              )}

              {/* 图床配置 */}
              <ActionButton onClick={onImageBedConfig} icon="Image" title="图床配置" />
            </>
          )}

          {/* 主开关按钮 */}
          <button
            onClick={onToggle}
            className={`w-12 h-12 rounded-full text-white flex items-center justify-center shadow-lg border border-white/10 transition-all duration-300 z-40 ${isOpen ? 'bg-[#2a2f38] rotate-90' : 'bg-[#ff4655] hover:bg-[#d93a49] shadow-red-900/40'
              }`}
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
