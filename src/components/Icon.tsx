/**
 * Icon - 组件层
 *
 * 模块定位：
 * - 所在层级：组件层
 * - 主要目标：承载界面渲染与事件分发
 *
 * 关键职责：
 * - 聚焦界面渲染与交互事件回调
 * - 接收上层 props 并输出稳定 UI 行为
 * - 避免在组件中堆积跨模块业务逻辑
 *
 * 主要导出：
 * - `IconName`、`default:Icon`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`lucide-react`
 * - 下游影响：供页面与应用壳组合
 */

// @ts-nocheck
import React from 'react';
import * as lucideIcons from 'lucide-react';

export type IconName = keyof typeof lucideIcons;

const Icon: React.FC<{ name: IconName; size?: number; className?: string }> = ({
  name,
  size = 18,
  className = '',
}) => {
  const Lucide = lucideIcons[name];
  if (!Lucide) return null;
  return <Lucide size={size} className={className} />;
};

export default Icon;
