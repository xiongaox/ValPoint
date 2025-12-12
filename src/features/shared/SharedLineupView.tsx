import React from 'react';
import LeafletMap from '../../components/LeafletMap';
import QuickActions from '../../components/QuickActions';
import Icon from '../../components/Icon';
import { SharedLineup, AgentOption } from '../../types/lineup';

type QuickActionsProps = {
  isActionMenuOpen: boolean;
  onToggle: () => void;
  onImageBedConfig: () => void;
  onAdvancedSettings: () => void;
  onChangePassword: () => void;
  onClearLineups: () => void;
  pendingTransfers: number;
};

type Props = {
  sharedLineup: SharedLineup;
  isSavingShared: boolean;
  onSaveShared: (lineup: SharedLineup) => void;
  onBack: () => void;
  getMapDisplayName: (name: string) => string;
  getMapEnglishName: (name: string) => string;
  getMapUrl: () => string | null;
  newLineupData: any;
  setNewLineupData: (fn: (prev: any) => any) => void;
  placingType: 'agent' | 'skill' | null;
  setPlacingType: React.Dispatch<React.SetStateAction<'agent' | 'skill' | null>>;
  selectedAgent: AgentOption | null;
  selectedAbilityIndex: number | null;
  onViewLineup: (id: string) => void;
  isFlipped: boolean;
  setViewingImage: (val: any) => void;
  quickActions: QuickActionsProps;
};

const SharedLineupView: React.FC<Props> = ({
  sharedLineup,
  isSavingShared,
  onSaveShared,
  onBack,
  getMapDisplayName,
  getMapEnglishName,
  getMapUrl,
  newLineupData,
  setNewLineupData,
  placingType,
  setPlacingType,
  selectedAgent,
  selectedAbilityIndex,
  onViewLineup,
  isFlipped,
  setViewingImage,
  quickActions,
}) => {
  const sharedImages = [
    { src: sharedLineup.standImg, desc: sharedLineup.standDesc, label: '站位 (Stand)' },
    { src: sharedLineup.stand2Img, desc: sharedLineup.stand2Desc, label: '站位 2 (Stand)' },
    { src: sharedLineup.aimImg, desc: sharedLineup.aimDesc, label: '瞄点 1 (Aim)' },
    { src: sharedLineup.aim2Img, desc: sharedLineup.aim2Desc, label: '瞄点 2 (Aim)' },
    { src: sharedLineup.landImg, desc: sharedLineup.landDesc, label: '落点 (Land)' },
  ].filter((item) => item.src);
  const sharedImageList = sharedImages.map((item) => item.src as string);

  return (
    <div className="flex h-screen w-screen bg-[#0f1923] text-white overflow-hidden">
      <div className="w-[360px] flex-shrink-0 flex flex-col bg-[#1f2326] border-r border-white/10 z-20 shadow-2xl">
        <div className="h-16 flex items-center justify-between gap-3 px-6 border-b border-white/5 bg-[#1f2326] shadow-sm">
          <div className="flex items-center gap-3">
            <img src="/brand-logo.svg" alt="Logo" className="w-[168px] h-[32px]" />
          </div>
          <button onClick={onBack} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
            返回主页
          </button>
        </div>

        <div className="p-6 border-b border-white/10 bg-[#252a30]">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded ${
                  sharedLineup.side === 'attack' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {sharedLineup.side === 'attack' ? '进攻 (ATK)' : '防守 (DEF)'}
              </span>
              <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">
                {getMapDisplayName(getMapEnglishName(sharedLineup.mapName))}
              </span>
            </div>
            <button
              onClick={() => onSaveShared(sharedLineup)}
              disabled={isSavingShared}
              className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-200 transition-colors px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Icon name="Save" size={14} /> {isSavingShared ? '保存中...' : '保存到我的点位'}
            </button>
          </div>
          <h2 className="text-2xl font-bold text-white leading-tight mb-4">{sharedLineup.title}</h2>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            {sharedLineup.agentIcon && <img src={sharedLineup.agentIcon} className="w-8 h-8 rounded-full" />}
            <span className="font-bold">{sharedLineup.agentName}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#181b1f]">
          <div className="grid grid-cols-1 gap-4">
            {sharedImages.map((item, idx) =>
              item.src ? (
                <div key={idx} className="flex flex-col gap-2">
                  <div className="text-[#ff4655] font-bold text-xs uppercase tracking-wider">{item.label}</div>
                  <div
                    className="relative group cursor-zoom-in aspect-video bg-[#0f1923] rounded-lg overflow-hidden border border-white/10 hover:border-[#ff4655] transition-colors"
                    onClick={() =>
                      setViewingImage({
                        src: item.src,
                        list: sharedImageList,
                        index: idx,
                      })
                    }
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
          {!sharedImages.length && <div className="h-full flex items-center justify-center text-gray-500 text-sm">暂无图片资料</div>}
        </div>
      </div>

      <div className="flex-1 relative bg-[#0f1923] z-0 border-l border-r border-white/10">
        <LeafletMap
          mapIcon={getMapUrl()}
          activeTab="shared"
          lineups={sharedLineup ? [sharedLineup] : []}
          selectedLineupId={sharedLineup?.id || null}
        onLineupSelect={() => {}}
        newLineupData={newLineupData}
        setNewLineupData={setNewLineupData}
        placingType={placingType}
        setPlacingType={(val) => setPlacingType(val as 'agent' | 'skill' | null)}
        selectedAgent={selectedAgent}
        selectedAbilityIndex={selectedAbilityIndex}
        onViewLineup={onViewLineup}
        isFlipped={isFlipped}
        sharedLineup={sharedLineup}
        />
        <QuickActions
          isOpen={quickActions.isActionMenuOpen}
          onToggle={quickActions.onToggle}
          onImageBedConfig={quickActions.onImageBedConfig}
          onAdvancedSettings={quickActions.onAdvancedSettings}
          onChangePassword={quickActions.onChangePassword}
          onClearLineups={quickActions.onClearLineups}
          pendingTransfers={quickActions.pendingTransfers}
        />
      </div>
    </div>
  );
};

export default SharedLineupView;
