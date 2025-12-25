import { useCallback } from 'react';
import { BaseLineup } from '../types/lineup';
import { downloadLineupBundle } from '../lib/lineupDownload';
import { useEmailAuth } from './useEmailAuth';
import { checkDailyDownloadLimit, incrementDownloadCount } from '../lib/downloadLimit';

type Params = {
  lineups: BaseLineup[];
  setAlertMessage: (msg: string | null) => void;
};

export const useLineupDownload = ({ lineups, setAlertMessage }: Params) => {
  const { user } = useEmailAuth();

  const handleDownload = useCallback(
    async (id: string, e?: React.MouseEvent) => {
      // Stop event propagation to prevent opening lineup details
      e?.stopPropagation();

      const lineup = lineups.find((item) => item.id === id);
      if (!lineup) {
        setAlertMessage('未找到要下载的点位');
        return;
      }

      // 检查下载限制
      if (user) {
        const { allowed, limit, remaining } = await checkDailyDownloadLimit(user.id);
        if (!allowed) {
          setAlertMessage(`今日下载次数已达上限 (${limit}次)，请明天再试`);
          return;
        }
      }

      try {
        // 静默下载，不显示提示
        const { failedImages } = await downloadLineupBundle(lineup);

        // 记录下载次数
        if (user) {
          await incrementDownloadCount(user.id);
        }

        if (failedImages.length > 0) {
          setAlertMessage('部分图片下载失败，已保留原链接');
        }
        // 成功时不弹窗提示
      } catch (error) {
        console.error(error);
        setAlertMessage('下载失败，请重试');
      }
    },
    [lineups, setAlertMessage, user],
  );

  return { handleDownload };
};
