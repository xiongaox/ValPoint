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
