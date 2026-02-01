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

const MapPickerModal = ({ isOpen, maps, selectedMap, setSelectedMap, setIsMapModalOpen, getMapDisplayName }) => {
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
          {maps.map((m, idx) => {
            const preview = m.listViewIcon || m.displayIcon;
            const isSelected = selectedMap?.uuid === m.uuid;
            return (
              <div
                key={m.uuid || `map-${idx}`}
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MapPickerModal;
