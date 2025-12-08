// @ts-nocheck
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import LeafletMap from './components/LeafletMap';
import { CUSTOM_MAP_URLS, MAP_TRANSLATIONS } from './constants/maps';
import MapPickerModal from './components/MapPickerModal';
import PreviewModal from './components/PreviewModal';
import AlertModal from './components/AlertModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import Lightbox from './components/Lightbox';
import EditorModal from './components/EditorModal';
import ViewerModal from './components/ViewerModal';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';
import Icon from './components/Icon';
import { changelogEntries } from './changelog';
import { useAuth } from './hooks/useAuth';
import { useLineups } from './hooks/useLineups';
import { useSharedLineups } from './hooks/useSharedLineups';
import { useLineupActions } from './hooks/useLineupActions';
import { useShareActions } from './hooks/useShareActions';
import { useValorantData } from './hooks/useValorantData';
import { useLineupFiltering } from './hooks/useLineupFiltering';
import { useModalState } from './hooks/useModalState';
import { getAbilityIcon } from './utils/abilityIcons';

const toDbPayload = (data, userId) => ({
  title: data.title,
  map_name: data.mapName,
  agent_name: data.agentName,
  agent_icon: data.agentIcon,
  skill_icon: data.skillIcon,
  side: data.side,
  ability_index: data.abilityIndex,
  agent_pos: data.agentPos,
  skill_pos: data.skillPos,
  stand_img: data.standImg,
  stand_desc: data.standDesc,
  stand2_img: data.stand2Img,
  stand2_desc: data.stand2Desc,
  aim_img: data.aimImg,
  aim_desc: data.aimDesc,
  aim2_img: data.aim2Img,
  aim2_desc: data.aim2Desc,
  land_img: data.landImg,
  land_desc: data.landDesc,
  source_link: data.sourceLink,
  user_id: userId,
  cloned_from: data.clonedFrom || null,
});

function App() {
  const [activeTab, setActiveTab] = useState('view');
  const [selectedSide, setSelectedSide] = useState('all');
  const [selectedAbilityIndex, setSelectedAbilityIndex] = useState(null);
  const { maps, agents, selectedMap, setSelectedMap, selectedAgent, setSelectedAgent } = useValorantData();
  const {
    isMapModalOpen,
    setIsMapModalOpen,
    isPreviewModalOpen,
    setIsPreviewModalOpen,
    previewInput,
    setPreviewInput,
    isEditorOpen,
    setIsEditorOpen,
    isClearConfirmOpen,
    setIsClearConfirmOpen,
    deleteTargetId,
    setDeleteTargetId,
    alertMessage,
    setAlertMessage,
    alertActionLabel,
    setAlertActionLabel,
    alertAction,
    setAlertAction,
    viewingImage,
    setViewingImage,
    isChangelogOpen,
    setIsChangelogOpen,
  } = useModalState();
  const mapNameZhToEn = useMemo(() => {
    const reverse = {};
    Object.entries(MAP_TRANSLATIONS).forEach(([en, zh]) => {
      reverse[zh] = en;
    });
    return reverse;
  }, []);
  const { lineups, setLineups, fetchLineups } = useLineups(mapNameZhToEn);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLineupId, setSelectedLineupId] = useState(null);
  const [viewingLineup, setViewingLineup] = useState(null);
  const [editingLineupId, setEditingLineupId] = useState(null);
  const [sharedLineup, setSharedLineup] = useState(null);
  const { sharedLineups, setSharedLineups, fetchSharedLineups, fetchSharedById } = useSharedLineups(mapNameZhToEn);
  const { saveNewLineup, updateLineup, deleteLineup, clearLineups } = useLineupActions();
  const [libraryMode, setLibraryMode] = useState('personal'); // personal | shared
  const createEmptyLineup = () => ({
    title: '',
    agentPos: null,
    skillPos: null,
    standImg: '',
    standDesc: '',
    stand2Img: '',
    stand2Desc: '',
    aimImg: '',
    aimDesc: '',
    aim2Img: '',
    aim2Desc: '',
    landImg: '',
    landDesc: '',
    sourceLink: '',
    enableStand2: false,
    enableAim2: false,
  });
  const [newLineupData, setNewLineupData] = useState(createEmptyLineup());
  const [placingType, setPlacingType] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const {
    userId,
    userMode,
    isGuest,
    isAuthModalOpen,
    setIsAuthModalOpen,
    pendingUserId,
    setPendingUserId,
    customUserIdInput,
    setCustomUserIdInput,
    passwordInput,
    setPasswordInput,
    isAuthLoading,
    targetUserId,
    handleApplyCustomUserId,
    handleResetUserId,
    handleConfirmUserAuth,
  } = useAuth({
    onAuthSuccess: async () => {},
    setAlertMessage,
  });
  const getMapDisplayName = (apiMapName) => MAP_TRANSLATIONS[apiMapName] || apiMapName;
  const getMapEnglishName = (displayName) =>
    Object.keys(MAP_TRANSLATIONS).find((key) => MAP_TRANSLATIONS[key] === displayName) || displayName;
  const mapCoverOverrides = {
    Abyss: 'https://game.gtimg.cn/images/val/agamezlk/map/abyss/cover.PNG',
  };

  const getMapCoverUrl = () => {
    const enName = getMapEnglishName(selectedMap?.displayName);
    const key = enName ? enName.toLowerCase() : '';
    const template = key ? `https://game.gtimg.cn/images/val/agamezlk/map/${key}/cover.PNG` : null;
    return mapCoverOverrides[enName] || template || selectedMap?.displayIcon || getMapUrl();
  };

  const { agentCounts, filteredLineups, sharedFilteredLineups, isFlipped, mapLineups } = useLineupFiltering({
    lineups,
    sharedLineups,
    libraryMode,
    selectedMap,
    selectedAgent,
    selectedSide,
    selectedAbilityIndex,
    searchQuery,
    activeTab,
    sharedLineup,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('id')) setActiveTab('shared');
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchLineups(userId);
  }, [fetchLineups, userId]);

  useEffect(() => {
    if (!userId) return;
    setLineups([]);
    setSelectedLineupId(null);
    setViewingLineup(null);
    setSharedLineup(null);
    setEditingLineupId(null);
    setIsEditorOpen(false);
    setPlacingType(null);
    setNewLineupData(createEmptyLineup());
    setActiveTab('view');
  }, [userId]);

  useEffect(() => {
    setSelectedLineupId(null);
    setViewingLineup(null);
  }, [libraryMode]);

  useEffect(() => {
    if (libraryMode === 'shared') fetchSharedLineups();
  }, [libraryMode, fetchSharedLineups]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('id');
    if (!shareId) return;
    const load = async () => {
      const lineup = await fetchSharedById(shareId);
      if (!lineup) {
        setAlertMessage('未找到该点位分享，可能已被删除。');
        setActiveTab('view');
        return;
      }
      setSharedLineup(lineup);
    };
    load();
  }, [fetchSharedById]);

  const handlePreviewSubmit = async () => {
    if (!previewInput.trim()) return;
    let idToLoad = previewInput.trim();
    try {
      const url = new URL(idToLoad);
      const idParam = url.searchParams.get('id');
      if (idParam) idToLoad = idParam;
    } catch (e) {}
    const lineup = await fetchSharedById(idToLoad);
    if (!lineup) return setAlertMessage('未找到该 ID 对应的点位。');
    setSharedLineup(lineup);
    setActiveTab('shared');
    setIsPreviewModalOpen(false);
    setPreviewInput('');
  };

  const handleTabSwitch = (tab) => {
    if (isGuest && tab === 'create') {
      setAlertMessage('游客模式仅支持查看，如需新增或编辑请设置密码进入登录模式');
      return;
    }
    setActiveTab(tab);
    setPlacingType(null);
    setSelectedLineupId(null);
    setViewingLineup(null);
    setEditingLineupId(null);
    setSharedLineup(null);
    if (tab === 'create') setLibraryMode('personal');
    if (tab !== 'shared') {
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {}
    }
    if (tab === 'create') {
      setNewLineupData(createEmptyLineup());
      if (selectedSide === 'all') setSelectedSide('attack');
    } else if (tab === 'view') {
      // 返回查看时重置筛选并刷新，若当前未选特工则选第一名，保持用户已有选择
      setSelectedSide('all');
      setSelectedAbilityIndex(null);
      if (!selectedAgent) {
        const firstAgent = agents[0];
        if (firstAgent) setSelectedAgent(firstAgent);
      }
      fetchLineups(userId);
    }
  };

  const handleOpenEditor = () => {
    if (isGuest) {
      setAlertMessage('游客模式仅支持查看，填写密码进入登录模式后才能新增或编辑点位');
      return;
    }
    if (!newLineupData.agentPos || !newLineupData.skillPos) return setAlertMessage('请先在地图上完成标注');
    if (!selectedAgent) return setAlertMessage('请先选择一名特工');
    setIsEditorOpen(true);
  };

  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setEditingLineupId(null);
    setNewLineupData(createEmptyLineup());
    setPlacingType(null);
    setActiveTab('view');
    setSelectedSide('all');
    setSelectedAbilityIndex(null);
    setSelectedLineupId(null);
    setViewingLineup(null);
  };

  const handleEditStart = (lineup) => {
    if (isGuest) {
      setAlertMessage('游客模式无法编辑点位，请先输入密码切换到登录模式');
      return;
    }
    const mapObj = maps.find((m) => getMapDisplayName(m.displayName) === lineup.mapName || m.displayName === lineup.mapName);
    if (mapObj) setSelectedMap(mapObj);
    const agentObj = agents.find((a) => a.displayName === lineup.agentName);
    if (agentObj) setSelectedAgent(agentObj);
    setSelectedSide(lineup.side);
    setSelectedAbilityIndex(lineup.abilityIndex);
    setNewLineupData({
      title: lineup.title,
      agentPos: lineup.agentPos,
      skillPos: lineup.skillPos,
      standImg: lineup.standImg || '',
      standDesc: lineup.standDesc || '',
      stand2Img: lineup.stand2Img || '',
      stand2Desc: lineup.stand2Desc || '',
      aimImg: lineup.aimImg || '',
      aimDesc: lineup.aimDesc || '',
      aim2Img: lineup.aim2Img || '',
      aim2Desc: lineup.aim2Desc || '',
      landImg: lineup.landImg || '',
      landDesc: lineup.landDesc || '',
      sourceLink: lineup.sourceLink || '',
      enableStand2: !!(lineup.stand2Img || lineup.stand2Desc),
      enableAim2: !!(lineup.aim2Img || lineup.aim2Desc),
    });
    setEditingLineupId(lineup.id);
    setViewingLineup(null);
    setActiveTab('create');
    setIsEditorOpen(true);
  };

  const handleEditorSave = async () => {
    if (isGuest) {
      setAlertMessage('游客模式无法保存点位，请先输入密码切换到登录模式');
      return;
    }
    if (!newLineupData.title.trim()) return setAlertMessage('标题不能为空');
    const cleaned = {
      ...newLineupData,
      stand2Img: newLineupData.enableStand2 ? newLineupData.stand2Img : '',
      stand2Desc: newLineupData.enableStand2 ? newLineupData.stand2Desc : '',
      aim2Img: newLineupData.enableAim2 ? newLineupData.aim2Img : '',
      aim2Desc: newLineupData.enableAim2 ? newLineupData.aim2Desc : '',
    };
    const commonData = {
      ...cleaned,
      mapName: selectedMap.displayName,
      agentName: selectedAgent.displayName,
      agentIcon: selectedAgent.displayIcon,
      skillIcon: getAbilityIcon(selectedAgent, selectedAbilityIndex),
      side: selectedSide,
      abilityIndex: selectedAbilityIndex,
      sourceLink: newLineupData.sourceLink,
    };
    try {
      if (editingLineupId) {
        await updateLineup(editingLineupId, { ...toDbPayload(commonData, userId), updated_at: new Date().toISOString() });
        setAlertMessage('更新成功，如已分享，请重新分享以同步共享库');
      } else {
        await saveNewLineup({ ...toDbPayload(commonData, userId), created_at: new Date().toISOString() });
        setAlertMessage('保存成功');
      }
      setIsEditorOpen(false);
      setEditingLineupId(null);
      setNewLineupData(createEmptyLineup());
      setSelectedSide('all');
      setSelectedAbilityIndex(null);
      setSelectedLineupId(null);
      setViewingLineup(null);
      setPlacingType(null);
      setActiveTab('view');
      fetchLineups(userId);
    } catch (e) {
      console.error(e);
      setAlertMessage('保存失败');
    }
  };

  const handleRequestDelete = (id, e) => {
    if (isGuest) {
      e?.stopPropagation();
      setAlertMessage('游客模式无法删除点位，请先输入密码切换到登录模式');
      return;
    }
    e.stopPropagation();
    setDeleteTargetId(id);
  };

  const performDelete = async () => {
    if (isGuest) {
      setAlertMessage('游客模式无法删除点位，请先输入密码切换到登录模式');
      return;
    }
    if (!deleteTargetId) return;
    try {
      await deleteLineup(deleteTargetId);
      setSelectedLineupId(null);
      setViewingLineup(null);
    } catch (e) {
      setAlertMessage('删除失败，请重试。');
    }
    setDeleteTargetId(null);
    fetchLineups(userId);
  };

  const { handleShare, handleSaveShared } = useShareActions({
    lineups,
    userId,
    isGuest,
    getMapEnglishName,
    setAlertMessage,
    setIsSharing,
    saveNewLineup,
    fetchLineups,
    handleTabSwitch,
    setAlertActionLabel,
    setAlertAction,
  });
  const onShare = useCallback(
    (id, e) => {
      e?.stopPropagation();
      handleShare(id);
    },
    [handleShare],
  );
  const onSaveShared = useCallback(
    (lineupParam = null) => handleSaveShared(lineupParam, sharedLineup),
    [handleSaveShared, sharedLineup],
  );

  const togglePlacingType = (type) => {
    if (isGuest) {
      setAlertMessage('游客模式无法标注点位，请先输入密码进入登录模式');
      return;
    }
    setPlacingType((prev) => (prev === type ? null : type));
  };

  const handleClearAll = () => {
    if (isGuest) {
      setAlertMessage('游客模式无法删除点位，请先输入密码切换到登录模式');
      return;
    }
    if (!lineups.length) {
      setAlertMessage('当前没有可删除的点位。');
      return;
    }
    setIsClearConfirmOpen(true);
  };

  const performClearAll = async () => {
    try {
      await clearLineups(userId);
      setIsClearConfirmOpen(false);
      setSelectedLineupId(null);
      setViewingLineup(null);
      setAlertMessage('已清空当前账号的点位。');
      fetchLineups(userId);
    } catch (e) {
      setAlertMessage('清空失败，请重试。');
    }
  };

  const handleViewLineup = useCallback(
    (id) => {
      setSelectedLineupId(id);
      const source = libraryMode === 'shared' ? sharedLineups : lineups;
      const lineup = source.find((l) => l.id === id);
      if (lineup) setViewingLineup(lineup);
    },
    [lineups, sharedLineups, libraryMode],
  );

  const getMapUrl = () => {
    if (activeTab === 'shared' && sharedLineup) {
      const enName = getMapEnglishName(sharedLineup.mapName);
      const config = CUSTOM_MAP_URLS[enName];
      if (config) return sharedLineup.side === 'defense' ? config.defense : config.attack;
    }
    if (!selectedMap) return null;
    const config = CUSTOM_MAP_URLS[selectedMap.displayName];
    if (config) return selectedSide === 'defense' ? config.defense : config.attack;
    return selectedMap.displayIcon;
  };

  if (activeTab === 'shared' && sharedLineup) {
    return (
      <div className="flex h-screen w-screen bg-[#0f1923] text-white overflow-hidden">
        <div className="w-[360px] flex-shrink-0 flex flex-col bg-[#1f2326] border-r border-white/10 z-20 shadow-2xl">
          <div className="h-16 flex items-center justify-between gap-3 px-6 border-b border-white/5 bg-[#1f2326] shadow-sm">
            <div className="flex items-center gap-3">
              <img src="/brand-logo.svg" alt="Logo" className="w-[168px] h-[32px]" />
            </div>
            <button onClick={() => handleTabSwitch('view')} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
              返回主页
            </button>
          </div>

          <div className="p-6 border-b border-white/10 bg-[#252a30]">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${sharedLineup.side === 'attack' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {sharedLineup.side === 'attack' ? '进攻 (ATK)' : '防守 (DEF)'}
                </span>
                <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">
                  {getMapDisplayName(getMapEnglishName(sharedLineup.mapName))}
                </span>
              </div>
              <button
                onClick={() => onSaveShared(sharedLineup)}
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-200 transition-colors px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30"
              >
                <Icon name="Save" size={14} /> 保存到我的点位
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
              {[
                { src: sharedLineup.standImg, desc: sharedLineup.standDesc, label: '站位 (Stand)' },
                { src: sharedLineup.stand2Img, desc: sharedLineup.stand2Desc, label: '站位 2 (Stand)' },
                { src: sharedLineup.aimImg, desc: sharedLineup.aimDesc, label: '瞄点 1 (Aim)' },
                { src: sharedLineup.aim2Img, desc: sharedLineup.aim2Desc, label: '瞄点 2 (Aim)' },
                { src: sharedLineup.landImg, desc: sharedLineup.landDesc, label: '落点 (Land)' },
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
            {!sharedLineup.standImg &&
              !sharedLineup.stand2Img &&
              !sharedLineup.aimImg &&
              !sharedLineup.aim2Img &&
              !sharedLineup.landImg && (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">暂无图片资料</div>
            )}
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
            setPlacingType={setPlacingType}
            selectedAgent={selectedAgent}
            selectedAbilityIndex={selectedAbilityIndex}
            onViewLineup={handleViewLineup}
            isFlipped={isFlipped}
            sharedLineup={sharedLineup}
          />
        </div>
        <Lightbox viewingImage={viewingImage} setViewingImage={setViewingImage} />
        <AlertModal message={alertMessage} onClose={() => setAlertMessage(null)} />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#0f1923] text-white overflow-hidden">
      <LeftPanel
        activeTab={activeTab}
        selectedMap={selectedMap}
        setIsMapModalOpen={setIsMapModalOpen}
        selectedSide={selectedSide}
        setSelectedSide={setSelectedSide}
        selectedAgent={selectedAgent}
        setSelectedAgent={setSelectedAgent}
        agents={agents}
        agentCounts={agentCounts}
        selectedAbilityIndex={selectedAbilityIndex}
        setSelectedAbilityIndex={setSelectedAbilityIndex}
        setIsPreviewModalOpen={setIsPreviewModalOpen}
        getMapDisplayName={getMapDisplayName}
        openChangelog={() => setIsChangelogOpen(true)}
      />

      <div className="flex-1 relative bg-[#0f1923] z-0 border-l border-r border-white/10">
        <LeafletMap
          mapIcon={getMapUrl()}
          mapCover={getMapCoverUrl()}
          activeTab={activeTab}
          lineups={mapLineups}
          selectedLineupId={selectedLineupId}
          onLineupSelect={setSelectedLineupId}
          newLineupData={newLineupData}
          setNewLineupData={setNewLineupData}
          placingType={placingType}
          setPlacingType={setPlacingType}
          selectedAgent={selectedAgent}
          selectedAbilityIndex={selectedAbilityIndex}
          onViewLineup={handleViewLineup}
          isFlipped={isFlipped}
          sharedLineup={sharedLineup}
        />
        {activeTab !== 'shared' && (
          <div className="absolute top-3 left-3 z-20 flex overflow-hidden rounded-xl border border-white/15 bg-black/70 backdrop-blur px-2 py-2 shadow-lg">
            <button
              onClick={() => setLibraryMode('personal')}
              className={`px-4 py-2 text-sm font-bold rounded-lg ${
                libraryMode === 'personal'
                  ? 'bg-[#ff4655] text-white'
                  : 'text-gray-100 hover:text-white hover:bg-white/10'
              }`}
            >
              个人库
            </button>
            <button
              onClick={() => setLibraryMode('shared')}
              disabled={activeTab === 'create'}
              className={`px-4 py-2 text-sm font-bold rounded-lg ${
                libraryMode === 'shared'
                  ? 'bg-emerald-500 text-white'
                  : 'text-gray-100 hover:text-white hover:bg-white/10'
              } ${activeTab === 'create' ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={activeTab === 'create' ? '创建模式仅支持个人库' : '切换到共享库（只读，可复制到个人库）'}
            >
              共享库
            </button>
          </div>
        )}
      </div>

      <RightPanel
        activeTab={activeTab}
        handleTabSwitch={handleTabSwitch}
        selectedSide={selectedSide}
        setSelectedSide={setSelectedSide}
        placingType={placingType}
        togglePlacingType={togglePlacingType}
        newLineupData={newLineupData}
        handleOpenEditor={handleOpenEditor}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredLineups={libraryMode === 'shared' ? sharedFilteredLineups : filteredLineups}
        selectedLineupId={selectedLineupId}
        handleViewLineup={handleViewLineup}
        handleShare={onShare}
        handleRequestDelete={handleRequestDelete}
        handleClearAll={handleClearAll}
        getMapDisplayName={getMapDisplayName}
        setIsPreviewModalOpen={setIsPreviewModalOpen}
        userId={userId}
        userMode={userMode}
        customUserIdInput={customUserIdInput}
        setCustomUserIdInput={setCustomUserIdInput}
        handleApplyCustomUserId={handleApplyCustomUserId}
        handleResetUserId={handleResetUserId}
        libraryMode={libraryMode}
        setLibraryMode={(mode) => {
          setLibraryMode(mode);
          setSelectedLineupId(null);
          setViewingLineup(null);
        }}
      />

      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[1200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#1f2326] border border-white/10 rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">创建/登录 ID</div>
                <h3 className="text-xl font-bold text-white mt-1">选择进入模式</h3>
                <p className="text-sm text-gray-400 mt-1">输入密码进入登录模式；留空进入游客模式（可查看和分享）。</p>
              </div>
              <button
                type="button"
                disabled={!userId}
                onClick={() => {
                  if (!userId) return;
                  setIsAuthModalOpen(false);
                  setPendingUserId('');
                  setPasswordInput('');
                }}
                className={`p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/40 transition-colors ${
                  userId ? '' : 'opacity-40 cursor-not-allowed'
                }`}
                title={userId ? '关闭' : '请先完成模式选择'}
              >
                <Icon name="X" size={16} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>当前 ID</span>
                <button
                  type="button"
                  onClick={handleResetUserId}
                  className="px-2 py-1 rounded border border-white/10 text-[11px] text-blue-300 hover:text-white hover:border-white/40 transition-colors"
                  title="生成新的随机 ID"
                >
                  随机 ID
                </button>
              </div>
              <input
                type="text"
                value={targetUserId.toUpperCase()}
                onChange={(e) => {
                  const next = (e.target.value || '').toUpperCase();
                  setPendingUserId(next);
                  setCustomUserIdInput(next);
                }}
                placeholder="请输入 8 位字母或数字"
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg font-mono text-sm text-white focus:border-[#ff4655] outline-none transition-colors"
                maxLength={8}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-400">密码（留空则游客模式：仅查看与分享）</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="请输入密码，或留空以游客身份进入"
                className="w-full bg-black/30 border border-gray-700 rounded-lg py-3 px-3 text-sm text-white focus:border-[#ff4655] outline-none transition-colors"
              />
            </div>
            <div className="text-[12px] text-gray-400 bg-black/20 border border-white/10 rounded-lg p-3 leading-relaxed">
              登录模式：可新增、编辑、删除、分享点位。<br />
              游客模式：可查看和分享该 ID 的点位数据，新增/编辑/删除入口隐藏。
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleConfirmUserAuth('')}
                disabled={isAuthLoading}
                className="px-4 py-2 rounded-lg border border-white/20 text-sm text-gray-200 hover:border-white/60 hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                以游客模式进入
              </button>
              <button
                type="button"
                onClick={() => handleConfirmUserAuth()}
                disabled={isAuthLoading}
                className="px-4 py-2 rounded-lg bg-[#ff4655] hover:bg-[#d93a49] text-white font-bold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isAuthLoading && <Icon name="Loader2" className="animate-spin" size={16} />}
                保存密码并登录
              </button>
            </div>
          </div>
        </div>
      )}

      <MapPickerModal
        isOpen={isMapModalOpen}
        maps={maps}
        selectedMap={selectedMap}
        setSelectedMap={setSelectedMap}
        setIsMapModalOpen={setIsMapModalOpen}
        getMapDisplayName={getMapDisplayName}
      />

      <PreviewModal
        isOpen={isPreviewModalOpen}
        previewInput={previewInput}
        setPreviewInput={setPreviewInput}
        onClose={() => setIsPreviewModalOpen(false)}
        onSubmit={handlePreviewSubmit}
      />

      <AlertModal
        message={alertMessage}
        actionLabel={alertActionLabel}
        onAction={alertAction}
        onClose={() => {
          setAlertMessage(null);
          setAlertActionLabel(null);
          setAlertAction(null);
        }}
      />

      <DeleteConfirmModal deleteTargetId={deleteTargetId} onCancel={() => setDeleteTargetId(null)} onConfirm={performDelete} />
      {isClearConfirmOpen && (
        <DeleteConfirmModal
          deleteTargetId="ALL"
          onCancel={() => setIsClearConfirmOpen(false)}
          onConfirm={performClearAll}
        />
      )}

      <EditorModal
        isEditorOpen={isEditorOpen}
        editingLineupId={editingLineupId}
        newLineupData={newLineupData}
        setNewLineupData={setNewLineupData}
        handleEditorSave={handleEditorSave}
        onClose={handleEditorClose}
        selectedSide={selectedSide}
        setSelectedSide={setSelectedSide}
      />

      <ViewerModal
        viewingLineup={viewingLineup}
        onClose={() => {
          setViewingLineup(null);
          setSelectedLineupId(null);
        }}
        handleEditStart={handleEditStart}
        setViewingImage={setViewingImage}
        getMapDisplayName={getMapDisplayName}
        getMapEnglishName={getMapEnglishName}
        isGuest={isGuest}
        libraryMode={libraryMode}
        handleCopyShared={onSaveShared}
      />

      <Lightbox viewingImage={viewingImage} setViewingImage={setViewingImage} />

      {isChangelogOpen && (
        <div className="fixed inset-0 z-[1300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#1f2326] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="History" className="text-[#ff4655]" />
                <h3 className="text-xl font-bold text-white">更新日志</h3>
              </div>
              <button
                onClick={() => setIsChangelogOpen(false)}
                className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/40 transition-colors"
              >
                <Icon name="X" size={16} />
              </button>
            </div>
            <div className="space-y-3 text-sm text-gray-200 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              {changelogEntries.map((entry) => (
                <div key={entry.date} className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
                  <div className="text-[#ff4655] text-xs font-bold uppercase tracking-wider">{entry.date}</div>
                  <ul className="list-disc list-inside space-y-1 text-gray-100">
                    {entry.items.map((item, idx) => {
                      if (typeof item === 'string') {
                        return <li key={idx}>{item}</li>;
                      }
                      return (
                        <li key={idx}>
                          {item.text}
                          {item.children && item.children.length > 0 && (
                            <ul className="list-disc list-inside pl-4 space-y-1 text-gray-300">
                              {item.children.map((child, cidx) => (
                                <li key={cidx}>{child}</li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;








