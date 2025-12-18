// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import Icon from './Icon';

type Props = {
  activeTab: string;
  handleTabSwitch: (tab: string) => void;
  selectedSide: string;
  setSelectedSide: (v: string) => void;
  placingType: string | null;
  togglePlacingType: (type: string) => void;
  newLineupData: any;
  handleOpenEditor: () => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filteredLineups: any[];
  selectedLineupId: string | null;
  handleViewLineup: (id: string) => void;
  handleDownload: (id: string, e: any) => void;
  handleRequestDelete: (id: string, e: any) => void;
  handleClearAll: () => void;
  getMapDisplayName: (name: string) => string;
  setIsPreviewModalOpen: (v: boolean) => void;
  userId: string | null;
  userMode: 'login' | 'guest';
  customUserIdInput: string;
  setCustomUserIdInput: (v: string) => void;
  handleApplyCustomUserId: () => void;
  handleResetUserId: () => void;
  libraryMode: 'personal' | 'shared';
  pinnedLineupIds: string[];
  onTogglePinLineup: (id: string) => void;
  pinnedLimit: number;
  onOpenSharedFilter: () => void;
  selectedSharedUserId: string | null;
};

const RightPanel: React.FC<Props> = ({
  activeTab,
  handleTabSwitch,
  selectedSide,
  setSelectedSide,
  placingType,
  togglePlacingType,
  newLineupData,
  handleOpenEditor,
  searchQuery,
  setSearchQuery,
  filteredLineups,
  selectedLineupId,
  handleViewLineup,
  handleDownload,
  handleRequestDelete,
  handleClearAll,
  getMapDisplayName,
  setIsPreviewModalOpen,
  userId,
  userMode,
  customUserIdInput,
  setCustomUserIdInput,
  handleApplyCustomUserId,
  handleResetUserId,
  libraryMode,
  pinnedLineupIds,
  onTogglePinLineup,
  pinnedLimit,
  onOpenSharedFilter,
  selectedSharedUserId,
}) => {
  const pageSize = 7;
  const [page, setPage] = useState(1);
  const showPagination = filteredLineups.length > 8;
  const totalPages = Math.max(1, Math.ceil(filteredLineups.length / pageSize));
  const isSharedMode = libraryMode === 'shared';

  useEffect(() => {
    setPage(1);
  }, [filteredLineups]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const visibleLineups = useMemo(() => {
    if (!showPagination) return filteredLineups;
    const start = (page - 1) * pageSize;
    return filteredLineups.slice(start, start + pageSize);
  }, [filteredLineups, page, showPagination]);

  return (
    <div className="w-96 flex-shrink-0 flex flex-col bg-[#1f2326] border-l border-white/10 z-20 shadow-2xl">
      <div className="flex border-b border-white/10">
        <button
          onClick={() => handleTabSwitch('view')}
          className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'view' ? 'bg-[#ff4655] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Icon name="Search" size={18} /> 查看点位
        </button>
        {userMode === 'login' && (
          <button
            onClick={() => {
              if (isSharedMode) return;
              handleTabSwitch('create');
            }}
            disabled={isSharedMode}
            className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'create' ? 'bg-[#ff4655] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
            } ${isSharedMode ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Icon name="Plus" size={18} /> 新增点位
          </button>
        )}
        <button
          onClick={() => setIsPreviewModalOpen(true)}
          className="py-4 px-4 flex items-center justify-center border-l border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          title="加载分享链接"
        >
          <Icon name="Link" size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        <div className="bg-[#0f1923] border border-white/10 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[12px] font-bold text-[#ff4655] uppercase tracking-wider">自定义 ID（跨设备共享）</div>
            {userId && (
              <div className="flex items-center gap-2 text-[11px] text-gray-400 truncate max-w-[200px]" title={`当前 ID：${userId}`}>
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] uppercase">{userMode === 'guest' ? '游客' : '登录'}</span>
                <span className="truncate">当前：{userId}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={customUserIdInput}
              onChange={(e) => setCustomUserIdInput(e.target.value)}
              placeholder="例如 TEAM1234"
              className="flex-1 bg-black/30 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:border-[#ff4655] outline-none transition-colors"
            />
            <button
              onClick={handleApplyCustomUserId}
              className="px-3 py-2 rounded-lg bg-[#ff4655] text-white text-sm font-bold hover:bg-[#d93a49] transition-colors whitespace-nowrap"
            >
              验证用户
            </button>
          </div>
          <div className="flex items-center justify-between text-[11px] text-gray-500">
            <span>用同一 ID 在不同设备访问即可看到同步数据</span>
            <button
              onClick={handleResetUserId}
              className="text-blue-400 hover:text-blue-200 transition-colors underline"
              title="生成一个新的随机 ID"
            >
              随机 ID
            </button>
          </div>
        </div>

        {activeTab === 'create' ? (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <label className="text-[12px] font-bold text-[#ff4655] uppercase tracking-wider block mb-3">
                1. 攻防选择 (Side) <span className="text-red-500">*</span>
              </label>
              <div className="flex bg-[#0f1923] p-1 rounded-lg border border-white/10 h-12">
                <button
                  onClick={() => setSelectedSide('attack')}
                  className={`flex-1 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all border ${
                    selectedSide === 'attack' ? 'bg-red-500/20 text-red-400 border-red-500/50 shadow' : 'text-gray-500 border-transparent hover:text-red-400'
                  }`}
                >
                  <Icon name="Sword" size={18} /> 进攻
                </button>
                <button
                  onClick={() => setSelectedSide('defense')}
                  className={`flex-1 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all border ${
                    selectedSide === 'defense'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow'
                      : 'text-gray-500 border-transparent hover:text-emerald-400'
                  }`}
                >
                  <Icon name="Shield" size={18} /> 防守
                </button>
              </div>
            </div>

            <div>
              <label className="text-[12px] font-bold text-[#ff4655] uppercase tracking-wider block mb-3">2. 地图标注工具</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => togglePlacingType('agent')}
                  className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                    newLineupData.agentPos
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
                      : placingType === 'agent'
                      ? 'bg-[#ff4655] text-white border-transparent'
                      : 'bg-[#0f1923] border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <Icon name="User" size={24} />
                  <span className="text-xs font-bold">{newLineupData.agentPos ? '站位已定' : '设置站位'}</span>
                </button>
                <button
                  onClick={() => togglePlacingType('skill')}
                  className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                    newLineupData.skillPos
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
                      : placingType === 'skill'
                      ? 'bg-[#ff4655] text-white border-transparent'
                      : 'bg-[#0f1923] border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <Icon name="Target" size={24} />
                  <span className="text-xs font-bold">{newLineupData.skillPos ? '落点已定' : '设置落点'}</span>
                </button>
              </div>
              <p className="text-[12px] text-gray-500 mt-2 text-center">
                {placingType ? '请在地图上点击位置完成标注' : '点击上方按钮开始标注'}
              </p>
            </div>

            <div>
              <label className="text-[12px] font-bold text-[#ff4655] uppercase tracking-wider block mb-3">3. 图文详情</label>
              <button
                onClick={handleOpenEditor}
                className="w-full bg-[#ff4655] hover:bg-[#d93a49] text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-colors uppercase tracking-wider shadow-lg shadow-red-900/20 group"
              >
                <Icon name="FileText" size={20} className="group-hover:scale-110 transition-transform" />
                填写图文攻略
              </button>
              <p className="text-[12px] text-gray-500 mt-2 text-center">添加标题、说明和截图</p>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="搜索点位标题..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 bg-[#0f1923] border border-gray-700 rounded-lg pl-10 pr-4 text-sm text-white focus:border-[#ff4655] outline-none transition-colors"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                <Icon name="Search" size={16} />
              </div>
            </div>
            {isSharedMode ? (
              <button
                onClick={onOpenSharedFilter}
                className="h-12 px-3 whitespace-nowrap font-bold rounded-lg flex items-center justify-center gap-2 uppercase tracking-wider transition-colors"
                style={{ backgroundColor: 'rgb(16, 185, 129)' }}
              >
                <Icon name="Filter" size={16} />
                筛选共享
              </button>
            ) : (
              <button
                onClick={handleClearAll}
                disabled={userMode === 'guest'}
                className={`h-12 px-3 whitespace-nowrap font-bold rounded-lg flex items-center justify-center gap-2 uppercase tracking-wider group transition-colors ${
                  userMode === 'guest'
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed border border-white/10 shadow-none'
                    : 'bg-[#ff4655] hover:bg-[#d93a49] text-white shadow-lg shadow-red-900/20'
                }`}
                title={userMode === 'guest' ? '游客模式仅可查看' : '清空当前 ID 的全部点位'}
              >
                <Icon name="Trash2" size={16} className="group-hover:scale-110 transition-transform" />
                清空点位
              </button>
            )}
          </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <div className="flex bg-[#0f1923] p-1 rounded-lg border border-white/10 mb-3">
                <button
                  onClick={() => setSelectedSide('all')}
                  className={`flex-1 py-2 rounded text-xs font-bold transition-all border ${
                    selectedSide === 'all' ? 'bg-gray-600 text-white border-gray-500 shadow' : 'text-gray-500 border-transparent hover:text-white'
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={() => setSelectedSide('attack')}
                  className={`flex-1 py-2 rounded text-xs font-bold flex items-center justify-center gap-1 transition-all border ${
                    selectedSide === 'attack' ? 'bg-red-500/20 text-red-400 border-red-500/50 shadow' : 'text-gray-500 border-transparent hover:text-red-400'
                  }`}
                >
                  <Icon name="Sword" size={14} /> 进攻
                </button>
                <button
                  onClick={() => setSelectedSide('defense')}
                  className={`flex-1 py-2 rounded text-xs font-bold flex items-center justify-center gap-1 transition-all border ${
                    selectedSide === 'defense'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow'
                      : 'text-gray-500 border-transparent hover:text-emerald-400'
                  }`}
                >
                  <Icon name="Shield" size={14} /> 防守
                </button>
              </div>
              {filteredLineups.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <Icon name="Search" size={48} className="mb-2 opacity-20" />
                  <span className="text-xs">暂无相关点位</span>
                </div>
              ) : (
                visibleLineups.map((l) => {
                  const isPinned = pinnedLineupIds.includes(l.id);
                  return (
                    <div
                      key={l.id}
                      onClick={() => handleViewLineup(l.id)}
                      className={`group relative p-4 rounded-lg border cursor-pointer transition-all flex items-center gap-4 h-20 ${
                        selectedLineupId === l.id ? 'bg-[#ff4655]/10 border-[#ff4655] shadow-md' : 'bg-[#0f1923] border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="relative">
                        {l.agentIcon ? (
                          <img src={l.agentIcon} className="w-10 h-10 rounded-full border border-white/10" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xs">{l.agentName?.[0]}</div>
                        )}
                        {l.skillIcon && <img src={l.skillIcon} className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#1f2326] rounded-full p-0.5 border border-white/20" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2 items-center mb-1">
                          <h4 className={`text-sm font-bold truncate ${selectedLineupId === l.id ? 'text-[#ff4655]' : 'text-white'}`}>{l.title}</h4>
                          <div className="flex gap-1 text-[12px] text-gray-500 shrink-0">
                            <span>{getMapDisplayName(l.mapName)}</span>
                            <span>·</span>
                            <span>{l.agentName}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                              l.side === 'attack'
                                ? 'text-red-400 border-red-500/30 bg-red-500/10'
                                : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                            }`}
                          >
                            {l.side === 'attack' ? '进攻' : '防守'}
                          </span>
                          <div className="ml-auto flex items-center gap-1">
                            {isSharedMode && l.userId && <span className="text-[12px] text-gray-500">{l.userId}</span>}
                            {!isSharedMode && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onTogglePinLineup(l.id);
                                }}
                                className={`p-1 rounded transition-colors ${
                                  isPinned ? 'text-amber-300 hover:text-amber-200' : 'text-gray-600 hover:text-amber-300'
                                } hover:bg-white/5`}
                                title={isPinned ? '取消置顶' : '置顶此点位'}
                              >
                                <Icon name="Pin" size={14} />
                              </button>
                            )}
                            {!isSharedMode && (
                              <button
                                onClick={(e) => handleDownload(l.id, e)}
                                className="text-gray-600 hover:text-emerald-400 p-1 rounded hover:bg-white/5 transition-colors"
                                title="下载"
                              >
                                <Icon name="Download" size={14} />
                              </button>
                            )}
                            {userMode === 'login' && !isSharedMode && (
                              <button
                                onClick={(e) => handleRequestDelete(l.id, e)}
                                className="text-gray-600 hover:text-red-500 p-1 rounded hover:bg-white/5 transition-colors"
                                title="删除"
                              >
                                <Icon name="Trash2" size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {showPagination && (
              <div className="mt-4 flex items-center justify-center gap-3 text-sm text-gray-200">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    page === 1
                      ? 'border-white/5 text-gray-600 cursor-not-allowed'
                      : 'border-white/10 text-white hover:border-white/40 hover:bg-white/5'
                  }`}
                >
                  上一页
                </button>
                <div className="px-4 h-10 flex items-center justify-center rounded-lg bg-black/30 border border-white/10 text-white font-mono text-xs">
                  {page} / {totalPages}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    page === totalPages
                      ? 'border-white/5 text-gray-600 cursor-not-allowed'
                      : 'border-[#ff4655]/60 text-white bg-[#ff4655]/10 hover:bg-[#ff4655]/20 hover:border-[#ff4655]'
                  }`}
                >
                  下一页
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RightPanel;
