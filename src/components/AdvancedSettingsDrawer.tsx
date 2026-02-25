/**
 * AdvancedSettingsDrawer - 组件层
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
 * - `default:AdvancedSettingsDrawer`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`./Icon`、`../types/imageProcessing`、`../hooks/useEscapeClose`
 * - 下游影响：供页面与应用壳组合
 */

﻿/**
 * AdvancedSettingsDrawer - 高级设置侧边抽屉
 * 
 * 提供应用的高级功能配置：
 * - UI 交互设置（隐藏库按钮等）
 * - (已分离 PNG 转换设置到 ImageProcessingModal)
 * - (已分离 修改密码到 ChangePasswordModal)
 */
import React, { useState } from 'react';
import Icon from './Icon';
import { ImageProcessingSettings } from '../types/imageProcessing';
import { useEscapeClose } from '../hooks/useEscapeClose';

type Props = {
  isOpen: boolean;
  settings: ImageProcessingSettings;
  onClose: () => void;
  onSave: (settings: ImageProcessingSettings) => void;
  userId: string | null;
};

const AdvancedSettingsDrawer: React.FC<Props> = ({ isOpen, settings, onClose, onSave, userId }) => {
  const [localSettings, setLocalSettings] = useState<ImageProcessingSettings>(settings);

  React.useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
    }
  }, [isOpen, settings]);

  useEscapeClose(isOpen, onClose);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
  };

  return (
    <>
      <div className="fixed inset-0 z-[1100] bg-black/50 backdrop-blur-sm" />
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-[#1f2326] border-l border-white/10 z-[1101] shadow-2xl flex flex-col animate-in slide-in-from-right">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ff4655]/15 border border-[#ff4655]/35 flex items-center justify-center text-[#ff4655]">
              <Icon name="SlidersHorizontal" size={18} />
            </div>
            <div className="leading-tight">
              <h3 className="text-lg font-bold text-white">高级设置</h3>
              <p className="text-xs text-gray-400">其他界面与交互偏好设置</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-[#ff4655]/50 transition-colors"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          <div className="bg-[#0f1923] border border-white/10 rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Icon name="EyeOff" size={18} className="text-[#ff4655]" />
                  <div className="text-sm font-bold text-white">隐藏库切换按钮</div>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">开启后，地图左上角的个人库/共享库切换按钮将完全隐藏。</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <button
                  onClick={() => setLocalSettings((prev) => ({ ...prev, hideSharedButton: !prev.hideSharedButton }))}
                  className={`relative w-14 h-8 rounded-full border transition-colors flex items-center px-1 flex-shrink-0 ${localSettings.hideSharedButton ? 'bg-[#ff4655] border-[#ff7884]' : 'bg-[#1c2430] border-white/10'
                    }`}
                >
                  <div
                    className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-150 ${localSettings.hideSharedButton ? 'translate-x-6' : 'translate-x-0'
                      }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#0f1923] border border-white/10 rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Icon name="EyeOff" size={18} className="text-[#ff4655]" />
                  <div className="text-sm font-bold text-white">隐藏作者信息按钮</div>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">开启后，地图右上角的项目地址、使用教程、打赏作者、联系作者按钮将完全隐藏。</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <button
                  onClick={() => setLocalSettings((prev) => ({ ...prev, hideAuthorLinks: !prev.hideAuthorLinks }))}
                  className={`relative w-14 h-8 rounded-full border transition-colors flex items-center px-1 flex-shrink-0 ${localSettings.hideAuthorLinks ? 'bg-[#ff4655] border-[#ff7884]' : 'bg-[#1c2430] border-white/10'
                    }`}
                >
                  <div
                    className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-150 ${localSettings.hideAuthorLinks ? 'translate-x-6' : 'translate-x-0'
                      }`}
                  />
                </button>
              </div>
            </div>
          </div>


        </div>

        <div className="p-6 border-t border-white/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-white/10 text-sm text-gray-200 hover:text-white hover:border-[#ff4655]/50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-[#ff5b6b] to-[#ff3c4d] hover:from-[#ff6c7b] hover:to-[#ff4c5e] shadow-lg shadow-red-900/30 transition-all"
          >
            保存设置
          </button>
        </div>
      </div>
    </>
  );
};

export default AdvancedSettingsDrawer;
