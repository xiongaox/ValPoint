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

type StoredImageProcessingSettings = Partial<ImageProcessingSettings> & {
  enablePngToJpg?: boolean;
  pngConvertFormat?: string;
};

const normalizeProcessingSettings = (settings?: StoredImageProcessingSettings): ImageProcessingSettings => {
  const enablePngConversion =
    settings?.enablePngConversion ?? settings?.enablePngToJpg ?? defaultImageProcessingSettings.enablePngConversion;

  const rawFormat = settings?.pngConvertFormat;
  const pngConvertFormat =
    rawFormat === 'jpeg' || rawFormat === 'webp'
      ? rawFormat
      : settings?.enablePngToJpg
        ? 'jpeg'
        : defaultImageProcessingSettings.pngConvertFormat;

  return {
    enablePngConversion,
    pngConvertFormat,
    jpegQuality: clampQuality(settings?.jpegQuality ?? defaultImageProcessingSettings.jpegQuality),
  };
};

type OutputFormat = 'jpeg' | 'webp';

const formatMimeMap: Record<OutputFormat, string> = {
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

const formatExtensionMap: Record<OutputFormat, string> = {
  jpeg: 'jpg',
  webp: 'webp',
};

const ensureExtension = (fileName: string, format: OutputFormat) => {
  const lower = fileName.toLowerCase();
  if (format === 'jpeg' && (lower.endsWith('.jpg') || lower.endsWith('.jpeg'))) {
    return fileName;
  }
  const ext = formatExtensionMap[format];
  return lower.endsWith(`.${ext}`) ? fileName : `${fileName}.${ext}`;
};

const convertBlobToImageFile = async (blob: Blob, format: OutputFormat, options: ImageCompressOptions = {}) => {
  const { quality = 1, maxWidth = 1920, maxHeight = 1920, fileName = 'image' } = options;
  const image = await loadImageFromBlob(blob);
  const { width, height } = getTargetSize(image.naturalWidth || image.width, image.naturalHeight || image.height, maxWidth, maxHeight);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('CANVAS_CONTEXT_UNAVAILABLE');
  ctx.drawImage(image, 0, 0, width, height);

  const outputBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error('IMAGE_CONVERSION_FAILED'));
        }
      },
      formatMimeMap[format],
      quality,
    );
  });

  const normalizedName = ensureExtension(fileName, format);
  return new File([outputBlob], normalizedName, { type: formatMimeMap[format] });
};

export const convertBlobToJpegFile = async (blob: Blob, options: ImageCompressOptions = {}) => {
  return convertBlobToImageFile(blob, 'jpeg', options);
};

export const convertBlobToWebpFile = async (blob: Blob, options: ImageCompressOptions = {}) => {
  return convertBlobToImageFile(blob, 'webp', options);
};

export const compressClipboardImage = async (blob: Blob, nameHint: string) => {
  const format = defaultImageProcessingSettings.pngConvertFormat;
  const convert = format === 'webp' ? convertBlobToWebpFile : convertBlobToJpegFile;
  return convert(blob, { fileName: nameHint, quality: defaultImageProcessingSettings.jpegQuality, maxWidth: 1920, maxHeight: 1920 });
};

export const prepareClipboardImage = async (blob: Blob, nameHint: string, settings?: Partial<ImageProcessingSettings>) => {
  const normalized = normalizeProcessingSettings(settings);
  if (!normalized.enablePngConversion) {
    const detectedType = blob.type || 'image/png';
    const ext = detectedType.split('/')[1] || 'png';
    return new File([blob], `${nameHint}.${ext}`, { type: detectedType });
  }
  const convert = normalized.pngConvertFormat === 'webp' ? convertBlobToWebpFile : convertBlobToJpegFile;
  return convert(blob, {
    fileName: nameHint,
    quality: normalized.jpegQuality,
    maxWidth: 1920,
    maxHeight: 1920,
  });
};
