import { useEffect, useState } from 'react';
import { ImageProcessingSettings, defaultImageProcessingSettings } from '../types/imageProcessing';

const STORAGE_KEY = 'valpoint_image_processing';

const clampQuality = (quality: number) => {
  if (Number.isNaN(quality)) return defaultImageProcessingSettings.jpegQuality;
  return Math.min(1, Math.max(0.1, quality));
};

const normalizeSettings = (settings: Partial<ImageProcessingSettings>): ImageProcessingSettings => ({
  enablePngToJpg: settings.enablePngToJpg ?? defaultImageProcessingSettings.enablePngToJpg,
  jpegQuality: clampQuality(settings.jpegQuality ?? defaultImageProcessingSettings.jpegQuality),
});

export function useImageProcessingSettings() {
  const [settings, setSettings] = useState<ImageProcessingSettings>(defaultImageProcessingSettings);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<ImageProcessingSettings>;
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
