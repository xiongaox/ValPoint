/**
 * useImageProcessingSettings.ts - 图片处理（水印/压缩）设置 Hook
 * 
 * 职责：
 * - 维护用户或系统定义的图片处理规则（如水印文字、透明度、比例等）
 * - 提供水印参数的可视化调整状态
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
