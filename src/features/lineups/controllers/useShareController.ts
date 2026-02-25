/**
 * useShareController - Feature 控制器层
 *
 * 模块定位：
 * - 所在层级：Feature 控制器层
 * - 主要目标：拆分点位业务流程与状态编排
 *
 * 关键职责：
 * - 按职责拆分点位业务控制器
 * - 组合状态、动作与生命周期逻辑
 * - 为视图层提供可直接消费的 props/handler
 *
 * 主要导出：
 * - `useShareController`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`../../../hooks/useShareActions`、`../../../types/lineup`、`../../../types/app`
 * - 下游影响：供 feature 入口控制器组合
 */

import { useCallback, useState } from 'react';
import { useShareActions } from '../../../hooks/useShareActions';
import { BaseLineup, SharedLineup, LineupDbPayload } from '../../../types/lineup';
import { ActiveTab } from '../../../types/app';
import { ImageBedConfig } from '../../../types/imageBed';

type Params = {
  lineups: BaseLineup[];
  userId: string | null;
  isGuest: boolean;
  getMapEnglishName: (name: string) => string;
  setAlertMessage: (msg: string | null) => void;
  handleTabSwitch: (tab: ActiveTab) => void;
  setAlertActionLabel: (label: string | null) => void;
  setAlertAction: (fn: (() => void) | null) => void;
  setAlertSecondaryLabel: (label: string | null) => void;
  setAlertSecondaryAction: (fn: (() => void) | null) => void;
  imageBedConfig: ImageBedConfig;
  saveNewLineup: (payload: LineupDbPayload) => Promise<BaseLineup>;
  fetchLineups: (userId: string | null) => Promise<void>;
  updateLineup: (id: string, payload: Partial<LineupDbPayload>) => Promise<void>;
};

export function useShareController({
  lineups,
  userId,
  isGuest,
  getMapEnglishName,
  setAlertMessage,
  handleTabSwitch,
  setAlertActionLabel,
  setAlertAction,
  setAlertSecondaryLabel,
  setAlertSecondaryAction,
  imageBedConfig,
  saveNewLineup,
  fetchLineups,
  updateLineup,
}: Params) {
  const [isSavingShared, setIsSavingShared] = useState(false);
  const [pendingTransfers, setPendingTransfers] = useState(0);

  const { handleShare, handleSaveShared } = useShareActions({
    lineups,
    userId,
    isGuest,
    getMapEnglishName,
    setAlertMessage,
    setIsSharing: () => {},
    saveNewLineup,
    fetchLineups,
    handleTabSwitch,
    setAlertActionLabel,
    setAlertAction,
    setAlertSecondaryLabel,
    setAlertSecondaryAction,
    imageBedConfig,
    openImageBedConfig: () => setAlertMessage('请在动作菜单中配置图床'),
    isSavingShared,
    setIsSavingShared,
    updateLineup,
    onTransferStart: (count: number) => setPendingTransfers((v) => v + count),
    onTransferProgress: (delta: number) => setPendingTransfers((v) => Math.max(0, v + delta)),
  });

  const onShare = useCallback(
    (id: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      handleShare(id);
    },
    [handleShare],
  );

  const onSaveShared = useCallback(
    (lineupParam: SharedLineup | null = null, sharedLineup?: SharedLineup | null) => {
      void handleSaveShared(lineupParam, sharedLineup ?? null);
    },
    [handleSaveShared],
  );

  return {
    onShare,
    onSaveShared,
    isSavingShared,
    pendingTransfers,
  };
}
