/**
 * useShareActions - 占位模块（本地版本）
 * 本地化版本不需要分享功能，此模块提供空操作
 */

import { useCallback } from 'react';
import { BaseLineup, SharedLineup, LineupDbPayload } from '../types/lineup';
import { ActiveTab } from '../types/app';
import { ImageBedConfig } from '../types/imageBed';

interface UseShareActionsOptions {
    lineups: BaseLineup[];
    userId: string | null;
    isGuest: boolean;
    getMapEnglishName: (name: string) => string;
    setAlertMessage: (msg: string | null) => void;
    setIsSharing: (v: boolean) => void;
    saveNewLineup: (payload: LineupDbPayload) => Promise<BaseLineup>;
    fetchLineups: (userId: string | null) => Promise<void>;
    handleTabSwitch: (tab: ActiveTab) => void;
    setAlertActionLabel: (label: string | null) => void;
    setAlertAction: (fn: (() => void) | null) => void;
    setAlertSecondaryLabel: (label: string | null) => void;
    setAlertSecondaryAction: (fn: (() => void) | null) => void;
    imageBedConfig: ImageBedConfig;
    openImageBedConfig: () => void;
    isSavingShared: boolean;
    setIsSavingShared: (v: boolean) => void;
    updateLineup: (id: string, payload: Partial<LineupDbPayload>) => Promise<void>;
    onTransferStart: (count: number) => void;
    onTransferProgress: (delta: number) => void;
}

export function useShareActions(options: UseShareActionsOptions) {
    const handleShare = useCallback(async (id: string) => {
        // 本地版本不支持分享到共享库
        options.setAlertMessage('本地版本不支持分享功能');
    }, [options]);

    const handleSaveShared = useCallback(async (
        lineupParam: SharedLineup | null = null,
        sharedLineup: SharedLineup | null = null
    ) => {
        // 本地版本不支持保存共享点位
        options.setAlertMessage('本地版本不支持共享功能');
    }, [options]);

    return {
        handleShare,
        handleSaveShared,
        isSharing: false,
    };
}
