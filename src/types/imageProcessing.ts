export type ImageProcessingSettings = {
  enablePngConversion: boolean;
  pngConvertFormat: 'jpeg' | 'webp';
  jpegQuality: number;
};

export const defaultImageProcessingSettings: ImageProcessingSettings = {
  enablePngConversion: true,
  pngConvertFormat: 'webp',
  jpegQuality: 0.82,
};
