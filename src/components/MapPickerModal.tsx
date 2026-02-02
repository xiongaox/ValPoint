/**
 * MapPickerModal - 地图选择器弹窗
 *
 * 职责：
 * - 渲染地图选择器弹窗内容与操作区域。
 * - 处理打开/关闭、确认/取消等交互。
 * - 与表单校验或数据提交逻辑联动。
 */

// @ts-nocheck
import React from 'react';
import Icon from './Icon';
import { useEscapeClose } from '../hooks/useEscapeClose';
import { MapOption, MapPoolStatus } from '../types/lineup';

/** 角标配置：状态 -> 显示文字、背景色 */
const POOL_STATUS_CONFIG: Record<MapPoolStatus, { label: string; className: string }> = {
  'in-pool': { label: '在池', className: 'bg-emerald-500/90' },
  'returning': { label: '回归', className: 'bg-blue-500/90' },
  'rotated-out': { label: '轮出', className: 'bg-red-500/90' },
};

type MapPickerModalProps = {
  isOpen: boolean;
  maps: MapOption[];
  selectedMap: MapOption | null;
  setSelectedMap: (map: MapOption) => void;
  setIsMapModalOpen: (open: boolean) => void;
  getMapDisplayName: (name: string) => string;
};

const MapPickerModal: React.FC<MapPickerModalProps> = ({
  isOpen,
  maps,
  selectedMap,
  setSelectedMap,
  setIsMapModalOpen,
  getMapDisplayName,
}) => {
  const handleClose = () => setIsMapModalOpen(false);
  useEscapeClose(isOpen, handleClose);

  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in"
    >
      <div className="w-full max-w-6xl max-h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold uppercase tracking-widest text-white">
            选择地图 <span className="text-[#ff4655]">SELECT MAP</span>
          </h2>
          <button onClick={handleClose} className="text-white hover:text-[#ff4655]">
            <Icon name="X" size={32} />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pb-4">
          {maps.map((m) => {
            const preview = m.listViewIcon || m.displayIcon;
            const isSelected = selectedMap?.uuid === m.uuid;
            const statusConfig = m.poolStatus ? POOL_STATUS_CONFIG[m.poolStatus] : null;
            return (
              <div
                key={m.uuid}
                onClick={() => {
                  setSelectedMap(m);
                  handleClose();
                }}
                className="group relative aspect-video rounded-xl overflow-hidden border-2 border-transparent hover:border-[#ff4655] cursor-pointer transition-all"
              >
                {preview ? (
                  <img src={preview} loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full bg-[#0f1923] flex items-center justify-center text-gray-500 text-sm">无预览</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/30 to-black/10 transition-opacity">
                  <div className="absolute inset-0 flex items-center justify-center text-center px-3">
                    <span className="font-bold text-4xl leading-tight uppercase tracking-widest drop-shadow-lg text-white/90">
                      {getMapDisplayName(m.displayName)}
                    </span>
                  </div>
                </div>
                {/* 排位池状态角标 */}
                {statusConfig && (
                  <div
                    className={`absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-semibold text-white shadow-md ${statusConfig.className}`}
                  >
                    {statusConfig.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MapPickerModal;
