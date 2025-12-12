export type ImageProcessingSettings = {
  enablePngToJpg: boolean;
  jpegQuality: number;
};

export const defaultImageProcessingSettings: ImageProcessingSettings = {
  enablePngToJpg: true,
  jpegQuality: 0.82,
};
