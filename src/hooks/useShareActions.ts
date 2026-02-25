/**
 * useShareActions - Hook 层
 *
 * 模块定位：
 * - 所在层级：Hook 层
 * - 主要目标：封装状态、副作用与交互流程
 *
 * 关键职责：
 * - 封装状态管理与副作用控制
 * - 对外暴露清晰的交互动作与派生状态
 * - 隔离组件层与数据层耦合
 *
 * 主要导出：
 * - `useShareActions`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`../supabaseClient`、`../services/shared`、`../services/lineups`
 * - 下游影响：供组件与控制器复用
 */

import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { upsertShared } from '../services/shared';
import { findLineupByClone } from '../services/lineups';
import { transferImage } from '../lib/imageBed';
import { ImageBedConfig } from '../types/imageBed';
import { BaseLineup, SharedLineup, LineupDbPayload } from '../types/lineup';

type AlertSetter = (msg: string | null) => void;
type ActionSetter = (fn: (() => void) | null) => void;
type Tab = 'view' | 'create' | 'shared';
type ImageFieldKey = 'standImg' | 'stand2Img' | 'aimImg' | 'aim2Img' | 'landImg';
type ImageSources = Partial<Record<ImageFieldKey, string | null | undefined>>;

const imageFields: ImageFieldKey[] = ['standImg', 'stand2Img', 'aimImg', 'aim2Img', 'landImg'];

const toShortId = (uuid: string) => {
  if (!uuid) return '';
  return uuid.substring(0, 8); // 说明：展示用 UUID 前 8 位。
};

type Params = {
  lineups: BaseLineup[];
  userId: string | null;
  isGuest: boolean;
  getMapEnglishName: (name: string) => string;
  setAlertMessage: AlertSetter;
  setAlertActionLabel: (label: string | null) => void;
  setAlertAction: ActionSetter;
  setAlertSecondaryLabel: (label: string | null) => void;
  setAlertSecondaryAction: ActionSetter;
  setIsSharing: (v: boolean) => void;
  saveNewLineup: (payload: LineupDbPayload) => Promise<BaseLineup>;
  fetchLineups: (userId: string | null) => Promise<void>;
  handleTabSwitch: (tab: Tab) => void;
  imageBedConfig: ImageBedConfig;
  openImageBedConfig: () => void;
  isSavingShared: boolean;
  setIsSavingShared: (v: boolean) => void;
  updateLineup: (id: string, payload: Partial<LineupDbPayload>) => Promise<void>;
  onTransferStart: (count: number) => void;
  onTransferProgress: (delta: number) => void;
};

const normalizeImageKeysForDb = (data: Partial<Record<ImageFieldKey, string>>) => {
  const result: Partial<LineupDbPayload> = {};
  Object.entries(data).forEach(([k, v]) => {
    const key = k as ImageFieldKey;
    switch (key) {
      case 'standImg':
        result.stand_img = v;
        break;
      case 'stand2Img':
        result.stand2_img = v;
        break;
      case 'aimImg':
        result.aim_img = v;
        break;
      case 'aim2Img':
        result.aim2_img = v;
        break;
      case 'landImg':
        result.land_img = v;
        break;
      default:
        break;
    }
  });
  return result;
};

const transferImagesToOwnBed = async (
  target: ImageSources,
  config: ImageBedConfig,
  onStep?: () => void,
) => {
  const replaced: Partial<Record<ImageFieldKey, string>> = {};
  const failed: ImageFieldKey[] = [];
  const cache = new Map<string, string>();

  const tasks = imageFields.map(async (key) => {
    const url = target[key];
    if (!url) return;
    if (cache.has(url)) {
      replaced[key] = cache.get(url) as string;
      onStep?.();
      return;
    }
    try {
      const newUrl = await transferImage(url, config);
      cache.set(url, newUrl);
      replaced[key] = newUrl;
    } catch (err) {
      console.error('转存图片失败', key, url, err);
      failed.push(key);
    } finally {
      onStep?.();
    }
  });

  await Promise.all(tasks);
  return { replaced, failed };
};

export const useShareActions = ({
  lineups,
  userId,
  isGuest,
  getMapEnglishName,
  setAlertMessage,
  setAlertActionLabel,
  setAlertAction,
  setAlertSecondaryLabel,
  setAlertSecondaryAction,
  setIsSharing,
  saveNewLineup,
  fetchLineups,
  handleTabSwitch,
  imageBedConfig,
  openImageBedConfig,
  isSavingShared,
  setIsSavingShared,
  updateLineup,
  onTransferStart,
  onTransferProgress,
}: Params) => {
  const ensureImageBedConfigured = () => {
    if (imageBedConfig?.provider && imageBedConfig.provider !== 'aliyun') {
      openImageBedConfig?.();
      setAlertActionLabel(null);
      setAlertAction(null);
      setAlertMessage('当前仅支持阿里云上传，其他图床上传功能稍后提供。');
      return false;
    }
    const required: Array<keyof ImageBedConfig> = ['accessKeyId', 'accessKeySecret', 'bucket', 'region'];
    const missing = required.filter((key) => !imageBedConfig?.[key]);
    if (!missing.length) return true;
    openImageBedConfig?.();
    setAlertActionLabel(null);
    setAlertAction(null);
    setAlertMessage('检测到未配置图床，已为你打开配置面板，请填写后再尝试转存图片。');
    return false;
  };

  const handleShare = useCallback(
    async (id: string) => {
      const lineup = lineups.find((l) => l.id === id);
      if (!lineup) {
        setAlertMessage('未找到要分享的点位');
        return;
      }
      if (lineup.clonedFrom) {
        const originalShareId = toShortId(lineup.clonedFrom);
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
      const shareId = toShortId(id);
      const payload = {
        id: id, // 说明：使用原始 ID 作为主键。
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
    async (lineupToSave: SharedLineup | null, fallbackSharedLineup: SharedLineup | null) => {
      if (isGuest) {
        setAlertMessage('游客模式无法保存点位，请先输入密码切换到登录模式');
        return;
      }
      if (!userId) {
        setAlertMessage('请先登录再保存点位');
        return;
      }
      if (isSavingShared) return;
      setIsSavingShared(true);
      setAlertActionLabel(null);
      setAlertAction(null);
      setAlertSecondaryLabel(null);
      setAlertSecondaryAction(null);
      const target = lineupToSave || fallbackSharedLineup;
      if (!target) {
        setIsSavingShared(false);
        return;
      }
      try {
        const existing = await findLineupByClone(userId, target.id);
        if (existing) {
          setAlertMessage('你已经保存过这个共享点位，无需重复添加。');
          handleTabSwitch('view');
          await fetchLineups(userId);
          return;
        }
        const mapNameEn = getMapEnglishName(target.mapName);
        const { id, ...data } = target;

        const payload: LineupDbPayload = {
          title: data.title,
          map_name: mapNameEn,
          agent_name: data.agentName,
          agent_icon: data.agentIcon || null,
          skill_icon: data.skillIcon || null,
          side: data.side,
          ability_index: data.abilityIndex ?? null,
          agent_pos: data.agentPos ?? null,
          skill_pos: data.skillPos ?? null,
          stand_img: data.standImg || null,
          stand_desc: data.standDesc || null,
          stand2_img: data.stand2Img || null,
          stand2_desc: data.stand2Desc || null,
          aim_img: data.aimImg || null,
          aim_desc: data.aimDesc || null,
          aim2_img: data.aim2Img || null,
          aim2_desc: data.aim2Desc || null,
          land_img: data.landImg || null,
          land_desc: data.landDesc || null,
          source_link: data.sourceLink || null,
          user_id: userId,
          cloned_from: id,
          created_at: new Date().toISOString(),
        };
        const inserted = await saveNewLineup(payload);

        const imageCount = imageFields.filter((key) => data[key]).length;
        if (imageCount && inserted?.id) {
          setAlertActionLabel('转移并替换');
          setAlertSecondaryLabel('保留原图');
          setAlertSecondaryAction(() => () => {
            setAlertMessage(null);
            setAlertActionLabel(null);
            setAlertAction(null);
            setAlertSecondaryLabel(null);
            setAlertSecondaryAction(null);
          });
          setAlertAction(() => async () => {
            onTransferStart(imageCount);
            setAlertMessage(null);
            setAlertActionLabel(null);
            setAlertAction(null);
            setAlertSecondaryLabel(null);
            setAlertSecondaryAction(null);
            let finished = 0;
            if (!ensureImageBedConfigured()) {
              onTransferProgress(-imageCount);
              return;
            }
            try {
              const { replaced, failed } = await transferImagesToOwnBed(data, imageBedConfig, () => {
                finished += 1;
                onTransferProgress(-1);
              });
              if (Object.keys(replaced).length) {
                const dbReplaced = normalizeImageKeysForDb(replaced);
                await updateLineup(inserted.id, { ...dbReplaced, updated_at: new Date().toISOString() });
                await fetchLineups(userId);
              }
              if (failed.length) {
                setAlertMessage('部分图片转存失败，已保留原链接。');
              }
            } catch (err) {
              console.error('后台转存失败', err);
              const remaining = imageCount - finished;
              if (remaining > 0) onTransferProgress(-remaining);
              setAlertMessage('图片转存失败，已保留原链接。');
            }
          });
          setAlertMessage('是否将图片转移到你的图床？点击“转移并替换”将在后台同步并更新链接，选择“保留原图”则直接使用当前链接。');
        } else {
          setAlertMessage(null);
          setAlertActionLabel(null);
          setAlertAction(null);
          setAlertSecondaryLabel(null);
          setAlertSecondaryAction(null);
        }
        handleTabSwitch('view');
        await fetchLineups(userId);
      } catch (err) {
        console.error(err);
        setAlertMessage('保存失败，请重试。');
        setAlertActionLabel(null);
        setAlertAction(null);
        setAlertSecondaryLabel(null);
        setAlertSecondaryAction(null);
      } finally {
        setIsSavingShared(false);
      }
    },
    [
      isGuest,
      userId,
      getMapEnglishName,
      setAlertMessage,
      handleTabSwitch,
      fetchLineups,
      setAlertActionLabel,
      setAlertAction,
      setAlertSecondaryLabel,
      setAlertSecondaryAction,
      isSavingShared,
      setIsSavingShared,
      imageBedConfig,
      openImageBedConfig,
      saveNewLineup,
      updateLineup,
      onTransferStart,
      onTransferProgress,
    ],
  );

  return { handleShare, handleSaveShared };
};
