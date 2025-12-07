// @ts-nocheck
import React from 'react';
import Icon from './Icon';

const ViewerModal = ({ viewingLineup, onClose, handleEditStart, setViewingImage, getMapDisplayName, getMapEnglishName, isGuest }) => {
  if (!viewingLineup) return null;
  return (
    <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="modal-content bg-[#1f2326] w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl border border-white/10 shadow-2xl overflow-hidden relative">
        <div className="p-6 border-b border-white/10 bg-[#252a30]">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span
                  className={`text-[12px] font-bold px-2 py-0.5 rounded ${
                    viewingLineup.side === 'attack' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {viewingLineup.side === 'attack' ? '进攻 (ATK)' : '防守 (DEF)'}
                </span>
                <span className="text-[12px] text-gray-500 font-mono">
                  {getMapDisplayName(getMapEnglishName(viewingLineup.mapName))}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">{viewingLineup.title}</h2>
              <div className="flex items-center gap-2 opacity-70">
                {viewingLineup.agentIcon && <img src={viewingLineup.agentIcon} className="w-7 h-7 rounded-full" />}
                <span className="text-sm font-bold text-white">{viewingLineup.agentName}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {viewingLineup.sourceLink && (
                <a
                  href={viewingLineup.sourceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white hover:border-[#ff4655] hover:text-[#ff4655] transition-colors"
                >
                  <Icon name="ExternalLink" size={14} /> 查看来源
                </a>
              )}
              {!isGuest && (
                <button
                  type="button"
                  onClick={() => handleEditStart(viewingLineup)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white hover:border-[#ff4655] hover:text-[#ff4655] transition-colors"
                  title="编辑"
                >
                  <Icon name="Pencil" size={14} /> 编辑
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#ff4655]/60 bg-[#ff4655]/10 text-sm text-white hover:bg-[#ff4655]/20 hover:border-[#ff4655] transition-colors"
                title="关闭"
              >
                <Icon name="X" size={14} /> 关闭
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-[#181b1f]">
          <div className="grid grid-cols-2 gap-6">
            {[
              { src: viewingLineup.standImg, desc: viewingLineup.standDesc, label: '1. 站位 (Stand)' },
              { src: viewingLineup.stand2Img, desc: viewingLineup.stand2Desc, label: '2. 站位 2 (Stand)' },
              { src: viewingLineup.aimImg, desc: viewingLineup.aimDesc, label: '3. 瞄点 1 (Aim)' },
              { src: viewingLineup.aim2Img, desc: viewingLineup.aim2Desc, label: '4. 瞄点 2 (Aim)' },
              { src: viewingLineup.landImg, desc: viewingLineup.landDesc, label: '5. 落点 (Land)' },
            ].map((item, idx) =>
              item.src ? (
                <div key={idx} className="flex flex-col gap-2">
                  <div className="text-[#ff4655] font-bold text-xs uppercase tracking-wider">{item.label}</div>
                  <div
                    className="relative group cursor-zoom-in aspect-video bg-[#0f1923] rounded-lg overflow-hidden border border-white/10 hover:border-[#ff4655] transition-colors"
                    onClick={() => setViewingImage(item.src)}
                  >
                    <img src={item.src} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Icon name="Maximize2" className="text-white" />
                    </div>
                  </div>
                  {item.desc && <div className="text-xs text-gray-300 bg-black/20 p-2 rounded border border-white/5">{item.desc}</div>}
                </div>
              ) : null,
            )}
          </div>
          {!viewingLineup.standImg &&
            !viewingLineup.stand2Img &&
            !viewingLineup.aimImg &&
            !viewingLineup.aim2Img &&
            !viewingLineup.landImg && (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm">暂无图片资料</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewerModal;
