import { ImageProcessingSettings, defaultImageProcessingSettings } from '../types/imageProcessing';

export type ImageCompressOptions = {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  fileName?: string;
};

const loadImageFromBlob = async (blob: Blob) => {
  const url = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('IMAGE_LOAD_FAILED'));
      img.src = url;
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
};

const getTargetSize = (width: number, height: number, maxWidth: number, maxHeight: number) => {
  if (width <= maxWidth && height <= maxHeight) return { width, height };
  const ratio = Math.min(maxWidth / width, maxHeight / height);
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
};

const clampQuality = (quality: number) => Math.min(1, Math.max(0.1, quality));

const normalizeProcessingSettings = (settings?: Partial<ImageProcessingSettings>): ImageProcessingSettings => ({
  enablePngToJpg: settings?.enablePngToJpg ?? defaultImageProcessingSettings.enablePngToJpg,
  jpegQuality: clampQuality(settings?.jpegQuality ?? defaultImageProcessingSettings.jpegQuality),
});

export const convertBlobToJpegFile = async (blob: Blob, options: ImageCompressOptions = {}) => {
  const { quality = 1, maxWidth = 1920, maxHeight = 1920, fileName = 'image' } = options;
  const image = await loadImageFromBlob(blob);
  const { width, height } = getTargetSize(image.naturalWidth || image.width, image.naturalHeight || image.height, maxWidth, maxHeight);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('CANVAS_CONTEXT_UNAVAILABLE');
  ctx.drawImage(image, 0, 0, width, height);

  const jpegBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error('JPEG_CONVERSION_FAILED'));
        }
      },
      'image/jpeg',
      quality,
    );
  });

  const normalizedName = fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg') ? fileName : `${fileName}.jpg`;
  return new File([jpegBlob], normalizedName, { type: 'image/jpeg' });
};

export const compressClipboardImage = async (blob: Blob, nameHint: string) => {
  return convertBlobToJpegFile(blob, { fileName: nameHint, quality: defaultImageProcessingSettings.jpegQuality, maxWidth: 1920, maxHeight: 1920 });
};

export const prepareClipboardImage = async (blob: Blob, nameHint: string, settings?: Partial<ImageProcessingSettings>) => {
  const normalized = normalizeProcessingSettings(settings);
  if (!normalized.enablePngToJpg && blob.type && blob.type.includes('png')) {
    const ext = blob.type.split('/')[1] || 'png';
    return new File([blob], `${nameHint}.${ext}`, { type: blob.type });
  }
  return convertBlobToJpegFile(blob, {
    fileName: nameHint,
    quality: normalized.jpegQuality,
    maxWidth: 1920,
    maxHeight: 1920,
  });
};
