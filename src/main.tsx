/**
 * main - 应用源码层
 *
 * 模块定位：
 * - 所在层级：应用源码层
 * - 主要目标：承载前端运行时主逻辑
 *
 * 关键职责：
 * - 承载当前文件的核心实现逻辑
 * - 处理输入输出与边界行为
 * - 向上层提供稳定可复用能力
 *
 * 主要导出：
 * - 当前文件以内部实现为主（无显式导出或仅默认匿名导出）
 *
 * 依赖关系：
 * - 上游依赖：`react`、`react-dom/client`、`./apps/user/UserApp`
 * - 下游影响：供 MPA 入口启动
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import UserApp from './apps/user/UserApp';

import './index.css';
import 'leaflet/dist/leaflet.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <UserApp />
  </React.StrictMode>,
);
