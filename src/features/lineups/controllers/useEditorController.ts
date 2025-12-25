/**
 * useEditorController - 点位编辑控制器
 * 
 * 处理点位新增和编辑的完整流程：
 * - handleOpenEditor: 打开编辑器（验证前置条件）
 * - handleEditorClose: 关闭编辑器并重置状态
 * - handleEditStart: 从现有点位开始编辑
 * - handleEditorSave: 保存点位（新增或更新）
 */
import { useCallback } from 'react';
import { getAbilityIcon } from '../../../utils/abilityIcons';
import { ActiveTab } from '../../../types/app';
import { AgentOption, BaseLineup, LibraryMode, NewLineupForm, SharedLineup, LineupDbPayload } from '../../../types/lineup';
import { createEmptyLineup, toDbPayload, checkTitleExists } from '../lineupHelpers';

type EditorParams = {
  isGuest: boolean;
  userId: string | null;
  activeTab: ActiveTab;
  selectedMap: { displayName: string; displayIcon?: string | null } | null;
  selectedAgent: AgentOption | null;
  selectedSide: 'all' | 'attack' | 'defense';
  selectedAbilityIndex: number | null;
  newLineupData: NewLineupForm;
  setNewLineupData: React.Dispatch<React.SetStateAction<NewLineupForm>>;
  setSelectedSide: React.Dispatch<React.SetStateAction<'all' | 'attack' | 'defense'>>;
  setSelectedAbilityIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setActiveTab: (tab: ActiveTab) => void;
  setPlacingType: React.Dispatch<React.SetStateAction<'agent' | 'skill' | null>>;
  setIsEditorOpen: (val: boolean) => void;
  setEditingLineupId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedLineupId: React.Dispatch<React.SetStateAction<string | null>>;
  setViewingLineup: React.Dispatch<React.SetStateAction<BaseLineup | null>>;
  setSelectedMap: React.Dispatch<React.SetStateAction<{ displayName: string; displayIcon?: string | null } | null>>;
  setSelectedAgent: React.Dispatch<React.SetStateAction<AgentOption | null>> | ((agent: AgentOption | null) => void);
  maps: { displayName: string; displayIcon?: string | null }[];
  agents: AgentOption[];
  getMapDisplayName: (name: string) => string;
  setAlertMessage: (msg: string) => void;
  fetchLineups: (userId: string) => void;
  saveNewLineup: (payload: LineupDbPayload) => Promise<BaseLineup>;
  updateLineup: (id: string, payload: Partial<LineupDbPayload>) => Promise<void>;
  editingLineupId: string | null;
  lineups: BaseLineup[];
};

export function useEditorController({
  isGuest,
  userId,
  activeTab,
  selectedMap,
  selectedAgent,
  selectedSide,
  selectedAbilityIndex,
  newLineupData,
  setNewLineupData,
  setSelectedSide,
  setSelectedAbilityIndex,
  setActiveTab,
  setPlacingType,
  setIsEditorOpen,
  setEditingLineupId,
  setSelectedLineupId,
  setViewingLineup,
  setSelectedMap,
  setSelectedAgent,
  maps,
  agents,
  getMapDisplayName,
  setAlertMessage,
  fetchLineups,
  saveNewLineup,
  updateLineup,
  editingLineupId,
  lineups,
}: EditorParams) {
  const handleOpenEditor = () => {
    if (isGuest) {
      setAlertMessage('游客模式仅支持查看，填写密码进入登录模式后才能新增或编辑点位');
      return;
    }
    if (!selectedMap) return setAlertMessage('请先选择地图');
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
    // 保持当前阵营，不强制跳转到 'all'
    setSelectedAbilityIndex(null);
    setSelectedLineupId(null);
    setViewingLineup(null);
  };

  const handleEditStart = (lineup: BaseLineup) => {
    if (isGuest) {
      setAlertMessage('游客模式无法编辑点位，请先输入密码切换到登录模式');
      return;
    }
    const mapObj = maps.find(
      (m) => getMapDisplayName(m.displayName) === lineup.mapName || m.displayName === lineup.mapName,
    );
    if (mapObj) setSelectedMap(mapObj);
    const agentObj = agents.find((a) => a.displayName === lineup.agentName);
    if (agentObj) setSelectedAgent(agentObj);
    setSelectedSide(lineup.side as 'attack' | 'defense');
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
      authorName: lineup.authorName || '',
      authorAvatar: lineup.authorAvatar || '',
      authorUid: lineup.authorUid || '',
      enableStand2: !!(lineup.stand2Img || lineup.stand2Desc),
      enableAim2: !!(lineup.aim2Img || lineup.aim2Desc),
    });
    setEditingLineupId(lineup.id);
    setViewingLineup(null);
    setActiveTab('create');
    setPlacingType(null);
    setIsEditorOpen(true);
  };

  const handleEditorSave = useCallback(async () => {
    if (isGuest) {
      setAlertMessage('游客模式无法保存点位，请先输入密码切换到登录模式');
      return;
    }
    if (!userId) {
      setAlertMessage('请先登录再保存点位');
      return;
    }
    if (!selectedMap || !selectedAgent) {
      setAlertMessage('请先选择地图和特工');
      return;
    }
    if (selectedAbilityIndex === null) {
      setAlertMessage('请先选择技能');
      return;
    }
    if (!newLineupData.title.trim()) return setAlertMessage('标题不能为空');

    // 检查标题是否重名（同一特工范围内）
    if (checkTitleExists(newLineupData.title, lineups, selectedAgent.displayName, editingLineupId)) {
      return setAlertMessage('该特工下已有同名标题，请使用其他标题');
    }

    const cleaned = {
      ...newLineupData,
      stand2Img: newLineupData.enableStand2 ? newLineupData.stand2Img : '',
      stand2Desc: newLineupData.enableStand2 ? newLineupData.stand2Desc : '',
      aim2Img: newLineupData.enableAim2 ? newLineupData.aim2Img : '',
      aim2Desc: newLineupData.enableAim2 ? newLineupData.aim2Desc : '',
    };
    const cleanedWithSource = cleaned.sourceLink.trim()
      ? { ...cleaned, sourceLink: cleaned.sourceLink.trim() }
      : { ...cleaned, sourceLink: '', authorName: '', authorAvatar: '', authorUid: '' };
    const sideForSave = selectedSide === 'all' ? 'attack' : selectedSide;
    const commonData = {
      title: cleanedWithSource.title,
      mapName: selectedMap.displayName,
      agentName: selectedAgent.displayName,
      agentIcon: selectedAgent.displayIcon || null,
      skillIcon: getAbilityIcon(selectedAgent, selectedAbilityIndex),
      side: sideForSave,
      abilityIndex: selectedAbilityIndex,
      agentPos: cleanedWithSource.agentPos,
      skillPos: cleanedWithSource.skillPos,
      standImg: cleanedWithSource.standImg,
      standDesc: cleanedWithSource.standDesc,
      stand2Img: cleanedWithSource.stand2Img,
      stand2Desc: cleanedWithSource.stand2Desc,
      aimImg: cleanedWithSource.aimImg,
      aimDesc: cleanedWithSource.aimDesc,
      aim2Img: cleanedWithSource.aim2Img,
      aim2Desc: cleanedWithSource.aim2Desc,
      landImg: cleanedWithSource.landImg,
      landDesc: cleanedWithSource.landDesc,
      sourceLink: cleanedWithSource.sourceLink,
      authorName: cleanedWithSource.authorName,
      authorAvatar: cleanedWithSource.authorAvatar,
      authorUid: cleanedWithSource.authorUid,
      clonedFrom: null,
    };
    try {
      if (editingLineupId) {
        await updateLineup(editingLineupId, {
          ...toDbPayload(commonData, userId),
          updated_at: new Date().toISOString(),
        });
        setAlertMessage('更新成功，如已分享，请重新分享以同步共享库');
      } else {
        await saveNewLineup({ ...toDbPayload(commonData, userId), created_at: new Date().toISOString() });
        setAlertMessage('保存成功');
      }
      setIsEditorOpen(false);
      setEditingLineupId(null);
      setNewLineupData(createEmptyLineup());
      // 保持当前阵营，不强制跳转到 'all'
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
  }, [
    isGuest,
    userId,
    selectedMap,
    selectedAgent,
    selectedAbilityIndex,
    newLineupData,
    selectedSide,
    editingLineupId,
    saveNewLineup,
    updateLineup,
    setAlertMessage,
    setIsEditorOpen,
    setEditingLineupId,
    setNewLineupData,
    setSelectedSide,
    setSelectedAbilityIndex,
    setSelectedLineupId,
    setViewingLineup,
    setPlacingType,
    setActiveTab,
    fetchLineups,
  ]);

  return {
    handleOpenEditor,
    handleEditorClose,
    handleEditStart,
    handleEditorSave,
  };
}
