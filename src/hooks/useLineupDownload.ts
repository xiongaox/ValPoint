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
        const lineup = lineups.find((l: BaseLineup) => l.id === id);
        if (!lineup) {
            setAlertMessage('找不到该点位');
            return;
        }

        setIsDownloading(true);
        try {
            // 地图名称映射
            const MAP_TRANSLATIONS: Record<string, string> = {
                Ascent: "亚海悬城", Bind: "源工重镇", Breeze: "微风岛屿", Fracture: "裂变峡谷",
                Haven: "隐世修所", Icebox: "森寒冬港", Lotus: "莲华古城", Pearl: "深海明珠",
                Split: "霓虹町", Sunset: "日落之城", Abyss: "幽邃地窟", Corrode: "盐海矿镇",
            };
            const mapNameZh = MAP_TRANSLATIONS[lineup.mapName] || lineup.mapName;

            // 技能槽位映射
            const slotMap = ['技能C', '技能Q', '技能E', '技能X'];
            const slot = lineup.abilityIndex !== null ? (slotMap[lineup.abilityIndex] || '技能') : '通用';

            // 生成下载文件名预览
            const fileName = `${mapNameZh}_${lineup.agentName}_${slot}_${lineup.title}.zip`;

            // 直接从 localStorage 读取最新的昵称，避免多实例 Hook 状态不同步问题
            let currentNickname = '';
            try {
                const saved = localStorage.getItem('valpoint_user_profile');
                if (saved) {
                    const profile = JSON.parse(saved);
                    currentNickname = profile.nickname;
                }
            } catch (e) {
                console.warn('Failed to read nickname from localStorage');
            }

            await exportLineupZipApi(id, fileName, currentNickname);
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
