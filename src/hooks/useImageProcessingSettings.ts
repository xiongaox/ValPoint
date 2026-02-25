/**
 * useImageProcessingSettings - Hook 层
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
 * - `useImageProcessingSettings`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`../types/imageProcessing`
 * - 下游影响：供组件与控制器复用
 */

import { useState, useCallback, useEffect } from 'react';
import { ImageProcessingSettings, defaultImageProcessingSettings } from '../types/imageProcessing';

const STORAGE_KEY = 'valpoint_image_processing';

const clampQuality = (quality: number) => {
  if (Number.isNaN(quality)) return defaultImageProcessingSettings.jpegQuality;
  return Math.min(1, Math.max(0.1, quality));
};

type StoredImageProcessingSettings = Partial<ImageProcessingSettings> & {
  enablePngToJpg?: boolean;
  pngConvertFormat?: string;
};

const normalizeSettings = (settings: StoredImageProcessingSettings): ImageProcessingSettings => {
  const enablePngConversion =
    settings.enablePngConversion ?? settings.enablePngToJpg ?? defaultImageProcessingSettings.enablePngConversion;

  const rawFormat = settings.pngConvertFormat;
  const pngConvertFormat =
    rawFormat === 'jpeg' || rawFormat === 'webp'
      ? rawFormat
      : settings.enablePngToJpg
        ? 'jpeg'
        : defaultImageProcessingSettings.pngConvertFormat;

  return {
    enablePngConversion,
    pngConvertFormat,
    jpegQuality: clampQuality(settings.jpegQuality ?? defaultImageProcessingSettings.jpegQuality),
    hideSharedButton: settings.hideSharedButton ?? defaultImageProcessingSettings.hideSharedButton,
    hideAuthorLinks: settings.hideAuthorLinks ?? defaultImageProcessingSettings.hideAuthorLinks,
  };
};

export function useImageProcessingSettings() {
  const [settings, setSettings] = useState<ImageProcessingSettings>(defaultImageProcessingSettings);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as StoredImageProcessingSettings;
        setSettings(normalizeSettings(parsed));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveSettings = (next: Partial<ImageProcessingSettings>) => {
    const normalized = normalizeSettings(next);
    setSettings(normalized);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch (e) {
      console.error(e);
    }
  };

  return { settings, saveSettings };
}
