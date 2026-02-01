/**
 * useLineupDownload - 点位下载/导出 Hook
 * 职责：调用后端 ZIP 导出接口，生成标准命名的压缩包。
 */

import { useCallback, useState } from 'react';
import { BaseLineup } from '../types/lineup';
import { exportLineupZipApi } from '../services/lineups';

interface UseLineupDownloadOptions {
    lineups: BaseLineup[];
    setAlertMessage: (msg: string | null) => void;
}

export function useLineupDownload({ lineups, setAlertMessage }: UseLineupDownloadOptions) {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = useCallback(async (id: string) => {
        const lineup = lineups.find(l => l.id === id);
        if (!lineup) {
            setAlertMessage('找不到该点位');
            return;
        }

        setIsDownloading(true);
        try {
            // 生成下载文件名预览（实际由后端 Content-Disposition 处理，但前端传递一个默认值）
            // 格式：地图_英雄_技能_标题.zip
            const fileName = `${lineup.mapName}_${lineup.agentName}_${lineup.title}.zip`;
            await exportLineupZipApi(id, fileName);
        } catch (error) {
            console.error('Download failed:', error);
            setAlertMessage('导出失败，请检查后端服务是否正常');
        } finally {
            setIsDownloading(false);
        }
    }, [lineups, setAlertMessage]);

    return {
        handleDownload,
        isDownloading,
    };
}
