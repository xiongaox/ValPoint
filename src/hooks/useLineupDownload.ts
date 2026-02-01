/**
 * useLineupDownload - 占位模块（本地版本）
 * 本地化版本的下载功能（简化）
 */

import { useCallback } from 'react';
import { BaseLineup } from '../types/lineup';

interface UseLineupDownloadOptions {
    lineups: BaseLineup[];
    setAlertMessage: (msg: string | null) => void;
}

export function useLineupDownload({ lineups, setAlertMessage }: UseLineupDownloadOptions) {
    const handleDownload = useCallback(async (id: string) => {
        const lineup = lineups.find(l => l.id === id);
        if (!lineup) {
            setAlertMessage('找不到该点位');
            return;
        }

        // 简单的下载逻辑：打开图片链接
        if (lineup.standImg) {
            window.open(lineup.standImg, '_blank');
        } else {
            setAlertMessage('该点位没有图片');
        }
    }, [lineups, setAlertMessage]);

    return {
        handleDownload,
        isDownloading: false,
    };
}
