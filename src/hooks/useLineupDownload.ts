/**
 * useLineupDownload - Hook 层
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
 * - `useLineupDownload`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`../types/lineup`、`../lib/lineupDownload`、`./useEmailAuth`
 * - 下游影响：供组件与控制器复用
 */

import { useCallback } from 'react';
import { BaseLineup } from '../types/lineup';
import { downloadLineupBundle } from '../lib/lineupDownload';
import { useEmailAuth } from './useEmailAuth';
import { checkDailyDownloadLimit, incrementDownloadCount, logDownload } from '../lib/downloadLimit';

type Params = {
  lineups: BaseLineup[];
  setAlertMessage: (msg: string | null) => void;
};

export const useLineupDownload = ({ lineups, setAlertMessage }: Params) => {
  const { user } = useEmailAuth();

  const handleDownload = useCallback(
    async (id: string, e?: React.MouseEvent) => {
      e?.stopPropagation();

      const lineup = lineups.find((item) => item.id === id);
      if (!lineup) {
        setAlertMessage('未找到要下载的点位');
        return;
      }

      if (user) {
        const { allowed, limit, remaining } = await checkDailyDownloadLimit(user.id);
        if (!allowed) {
          setAlertMessage(`今日下载次数已达上限 (${limit}次)，请明天再试`);
          return;
        }
      }

      try {
        const { failedImages } = await downloadLineupBundle(lineup);

        if (user) {
          await incrementDownloadCount(user.id);
          await logDownload({
            userId: user.id,
            userEmail: user.email || '',
            lineupId: lineup.id,
            lineupTitle: lineup.title,
            mapName: lineup.mapName,
            agentName: lineup.agentName,
          });
        }

        if (failedImages.length > 0) {
          setAlertMessage('部分图片下载失败，已保留原链接');
        }
      } catch (error) {
        console.error(error);
        setAlertMessage('下载失败，请重试');
      }
    },
    [lineups, setAlertMessage, user],
  );

  return { handleDownload };
};
