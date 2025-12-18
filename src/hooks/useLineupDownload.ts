import { useCallback } from 'react';
import { BaseLineup } from '../types/lineup';
import { downloadLineupBundle } from '../lib/lineupDownload';

type Params = {
  lineups: BaseLineup[];
  setAlertMessage: (msg: string | null) => void;
};

export const useLineupDownload = ({ lineups, setAlertMessage }: Params) => {
  const handleDownload = useCallback(
    async (id: string) => {
      const lineup = lineups.find((item) => item.id === id);
      if (!lineup) {
        setAlertMessage('未找到要下载的点位');
        return;
      }
      try {
        setAlertMessage('正在打包下载...');
        const { failedImages } = await downloadLineupBundle(lineup);
        if (failedImages.length > 0) {
          setAlertMessage('部分图片下载失败，已保留原链接');
          return;
        }
        setAlertMessage('点位压缩包已下载');
      } catch (error) {
        console.error(error);
        setAlertMessage('下载失败，请重试');
      }
    },
    [lineups, setAlertMessage],
  );

  return { handleDownload };
};
