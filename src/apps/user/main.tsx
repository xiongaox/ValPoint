/**
 * main - 应用壳层(user)
 *
 * 模块定位：
 * - 所在层级：应用壳层(user)
 * - 主要目标：承载个人库业务流程与 UI 组合
 *
 * 关键职责：
 * - 承载应用入口装配与页面级流程
 * - 协调共享模块与业务模块的组合
 * - 保证不同 MPA 入口行为一致且可维护
 *
 * 主要导出：
 * - 当前文件以内部实现为主（无显式导出或仅默认匿名导出）
 *
 * 依赖关系：
 * - 上游依赖：`react`、`react-dom/client`、`./UserApp`、`../../utils/playerCardAvatars`
 * - 下游影响：供 user.html 入口挂载
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import UserApp from './UserApp';
import { preloadPlayerCards } from '../../utils/playerCardAvatars';

preloadPlayerCards();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <UserApp />
    </React.StrictMode>
);
