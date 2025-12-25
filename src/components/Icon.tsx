// @ts-nocheck
/**
 * Icon - 图标组件包装器
 * 
 * 统一包装 lucide-react 图标，通过 name 字符串动态加载特定的图标组件。
 */
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
