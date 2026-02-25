/**
 * imageProcessing - 类型层
 *
 * 模块定位：
 * - 所在层级：类型层
 * - 主要目标：集中定义跨模块共享类型
 *
 * 关键职责：
 * - 定义稳定的类型契约与字段语义
 * - 减少跨模块调用歧义
 * - 提升重构与联调时的可预期性
 *
 * 主要导出：
 * - `ImageProcessingSettings`、`defaultImageProcessingSettings`
 *
 * 依赖关系：
 * - 上游依赖：无显式外部模块依赖
 * - 下游影响：供全局编译期约束
 */

export type ImageProcessingSettings = {
  enablePngConversion: boolean;
  pngConvertFormat: 'jpeg' | 'webp';
  jpegQuality: number;
  hideSharedButton?: boolean;
  hideAuthorLinks?: boolean;
};

export const defaultImageProcessingSettings: ImageProcessingSettings = {
  enablePngConversion: true,
  pngConvertFormat: 'webp',
  jpegQuality: 0.82,
  hideSharedButton: false,
  hideAuthorLinks: false,
};
