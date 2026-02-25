/**
 * main - 应用壳层(admin)
 *
 * 模块定位：
 * - 所在层级：应用壳层(admin)
 * - 主要目标：承载管理后台流程与页面路由
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
 * - 上游依赖：`react`、`react-dom/client`、`./AdminApp`、`../../utils/playerCardAvatars`
 * - 下游影响：供 admin.html 入口挂载
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminApp from './AdminApp';
import { preloadPlayerCards } from '../../utils/playerCardAvatars';

preloadPlayerCards();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <AdminApp />
    </React.StrictMode>
);
