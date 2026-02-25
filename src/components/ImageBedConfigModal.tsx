/**
 * ImageBedConfigModal - 组件层
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
 * - `default:ImageBedConfigModal`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`./Icon`、`../types/imageBed`、`../lib/imageBed`
 * - 下游影响：供页面与应用壳组合
 */

import React, { useEffect, useState } from 'react';
import Icon from './Icon';
import { ImageBedConfig } from '../types/imageBed';
import { defaultImageBedConfig } from '../lib/imageBed';
import ImageBedConfigForm, { normalizeConfig } from './ImageBedConfigForm';
import { useEscapeClose } from '../hooks/useEscapeClose';

type Props = {
  isOpen: boolean;
  config: ImageBedConfig;
  onClose: () => void;
  onSave: (cfg: ImageBedConfig) => void;
};

const ImageBedConfigModal: React.FC<Props> = ({ isOpen, config, onClose, onSave }) => {
  const [localConfig, setLocalConfig] = useState<ImageBedConfig>(defaultImageBedConfig);

  useEffect(() => {
    if (isOpen) {
      setLocalConfig(normalizeConfig(config));
    }
  }, [isOpen, config]);

  useEscapeClose(isOpen, onClose);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localConfig);
  };

  return (
    <div
      className="fixed inset-0 z-[1400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#181b1f]/95 shadow-2xl shadow-black/50 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#1c2028]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ff4655]/15 border border-[#ff4655]/35 flex items-center justify-center text-[#ff4655]">
              <Icon name="Cloudy" size={18} />
            </div>
            <div className="leading-tight">
              <div className="text-xl font-bold text-white">图床配置</div>
              <div className="text-xs text-gray-500">本地存储，仅当前设备生效，可复制 / 导入 / 导出</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors"
            aria-label="关闭"
          >
            <Icon name="X" size={16} />
          </button>
        </div>

        <div className="p-6 space-y-6 bg-[#181b1f]">
          <ImageBedConfigForm
            config={localConfig}
            onChange={setLocalConfig}
            showProviderSwitch={true}
            showCopyImport={true}
            showReset={true}
            layout="full"
          />

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div className="text-xs text-gray-500">提示：密钥仅保存在本机；如需换设备请先导出。</div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-white/15 text-sm text-gray-200 hover:border-white/40 hover:bg-white/5 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-colors flex items-center gap-2 shadow-md shadow-emerald-900/30"
              >
                <Icon name="Check" size={16} /> 确认
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { defaultImageBedConfig } from '../lib/imageBed';
export default ImageBedConfigModal;
