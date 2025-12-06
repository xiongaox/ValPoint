// @ts-nocheck
import React from 'react';
import Icon from './Icon';

const MapPickerModal = ({ isOpen, maps, selectedMap, setSelectedMap, setIsMapModalOpen, getMapDisplayName }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in">
      <div className="w-full max-w-6xl max-h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold uppercase tracking-widest text-white">
            选择地图 <span className="text-[#ff4655]">SELECT MAP</span>
          </h2>
          <button onClick={() => setIsMapModalOpen(false)} className="text-white hover:text-[#ff4655]">
            <Icon name="X" size={32} />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pb-4">
          {maps.map((m) => (
            <div
              key={m.uuid}
              onClick={() => {
                setSelectedMap(m);
                setIsMapModalOpen(false);
              }}
              className={`map-card relative aspect-video rounded-xl overflow-hidden border-2 cursor-pointer ${
                selectedMap?.uuid === m.uuid ? 'border-[#ff4655]' : 'border-transparent'
              }`}
            >
              <img src={m.listViewIcon} loading="lazy" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 hover:bg-transparent transition-colors flex items-center justify-center">
                <span className="font-bold text-[2.2rem] leading-tight uppercase tracking-widest drop-shadow-lg text-center">
                  {getMapDisplayName(m.displayName)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapPickerModal;
