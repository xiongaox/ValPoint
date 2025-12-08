// @ts-nocheck
import { useCallback } from 'react';
import { upsertShared } from '../services/shared';
import { findLineupByClone } from '../services/lineups';

const toShortShareId = (uuid: string) => {
  if (!uuid) return '';
  const parts = uuid.split('-');
  if (parts.length === 5) return `${parts[3]}-${parts[4]}`;
  return uuid;
};

type Params = {
  lineups: any[];
  userId: string | null;
  isGuest: boolean;
  getMapEnglishName: (name: string) => string;
  setAlertMessage: (msg: string | null) => void;
  setAlertActionLabel: (label: string | null) => void;
  setAlertAction: (fn: (() => void) | null) => void;
  setIsSharing: (v: boolean) => void;
  saveNewLineup: (payload: any) => Promise<void>;
  fetchLineups: (userId: string | null) => Promise<void>;
  handleTabSwitch: (tab: string) => void;
};

export const useShareActions = ({
  lineups,
  userId,
  isGuest,
  getMapEnglishName,
  setAlertMessage,
  setAlertActionLabel,
  setAlertAction,
  setIsSharing,
  saveNewLineup,
  fetchLineups,
  handleTabSwitch,
}: Params) => {
  const handleShare = useCallback(
    async (id: string) => {
      const lineup = lineups.find((l) => l.id === id);
      if (!lineup) {
        setAlertMessage('未找到要分享的点位');
        return;
      }
      // 若该点位来自共享库副本，提示直接使用原分享，无需再次创建，避免重复数据
      if (lineup.clonedFrom) {
        const originalShareId = toShortShareId(lineup.clonedFrom);
        setAlertActionLabel('复制原分享ID');
        setAlertAction(() => () => {
          const textArea = document.createElement('textarea');
          textArea.value = originalShareId;
          textArea.style.position = 'fixed';
          textArea.style.left = '-9999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          try {
            document.execCommand('copy');
            setAlertMessage('已复制原分享ID');
          } catch (err) {
            setAlertMessage(`请手动复制原分享ID：${originalShareId}`);
          }
          document.body.removeChild(textArea);
          setAlertActionLabel(null);
          setAlertAction(null);
        });
        setAlertMessage('该点位来自共享库，直接使用原分享ID即可，无需再次分享。');
        return;
      }
      setAlertActionLabel(null);
      setAlertAction(null);
      const shareId = toShortShareId(id);
      const payload = {
        share_id: shareId,
        source_id: id,
        ...{
          title: lineup.title,
          map_name: getMapEnglishName(lineup.mapName),
          agent_name: lineup.agentName,
          agent_icon: lineup.agentIcon,
          skill_icon: lineup.skillIcon,
          side: lineup.side,
          ability_index: lineup.abilityIndex,
          agent_pos: lineup.agentPos,
          skill_pos: lineup.skillPos,
          stand_img: lineup.standImg,
          stand_desc: lineup.standDesc,
          stand2_img: lineup.stand2Img,
          stand2_desc: lineup.stand2Desc,
          aim_img: lineup.aimImg,
          aim_desc: lineup.aimDesc,
          aim2_img: lineup.aim2Img,
          aim2_desc: lineup.aim2Desc,
          land_img: lineup.landImg,
          land_desc: lineup.landDesc,
          source_link: lineup.sourceLink,
          user_id: userId,
          cloned_from: lineup.clonedFrom || null,
        },
        created_at: lineup.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      try {
        setIsSharing(true);
        await upsertShared(payload);
        const textArea = document.createElement('textarea');
        textArea.value = shareId;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          setAlertMessage('分享 ID 已复制，好友可直接预览。\n提示：分享库数据会在 15 天后自动清理，请及时保存到个人库。');
        } catch (err) {
          setAlertMessage('复制失败，请手动复制 ID：\n' + shareId + '\n提示：分享库数据会在 15 天后自动清理，请及时保存到个人库。');
        }
        document.body.removeChild(textArea);
      } catch (err) {
        console.error(err);
        setAlertMessage('分享失败，请重试');
      } finally {
        setAlertActionLabel(null);
        setAlertAction(null);
        setIsSharing(false);
      }
    },
    [lineups, userId, getMapEnglishName, setAlertMessage, setAlertActionLabel, setAlertAction, setIsSharing],
  );

  const handleSaveShared = useCallback(
    async (lineupToSave: any, fallbackSharedLineup: any) => {
      if (isGuest) {
        setAlertMessage('游客模式无法保存点位，请先输入密码切换到登录模式');
        return;
      }
      if (!userId) {
        setAlertMessage('请先登录再保存点位');
        return;
      }
      setAlertActionLabel(null);
      setAlertAction(null);
      const target = lineupToSave || fallbackSharedLineup;
      if (!target) return;
      try {
        const existing = await findLineupByClone(userId, target.id);
        if (existing) {
          setAlertMessage('你已经保存过这个共享点位，无需重复添加。');
          handleTabSwitch('view');
          fetchLineups(userId);
          return;
        }
        const mapNameEn = getMapEnglishName(target.mapName);
        const { id, ...data } = target;
        const payload = {
          title: data.title,
          map_name: mapNameEn,
          agent_name: data.agentName,
          agent_icon: data.agentIcon,
          skill_icon: data.skillIcon,
          side: data.side,
          ability_index: data.abilityIndex ?? null,
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
          cloned_from: id,
          created_at: new Date().toISOString(),
        };
        await saveNewLineup(payload);
        setAlertMessage('已成功保存到你的点位列表');
        handleTabSwitch('view');
        fetchLineups(userId);
      } catch (err) {
        console.error(err);
        setAlertMessage('保存失败，请重试。');
      }
    },
    [isGuest, getMapEnglishName, saveNewLineup, userId, handleTabSwitch, fetchLineups, setAlertMessage],
  );

  return { handleShare, handleSaveShared };
};
