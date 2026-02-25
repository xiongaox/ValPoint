/**
 * types - 基础库(imageBed)
 *
 * 模块定位：
 * - 所在层级：基础库(imageBed)
 * - 主要目标：封装图床上传/转存能力
 *
 * 关键职责：
 * - 提供与框架解耦的通用能力函数
 * - 处理下载、导入、校验、系统配置等基础逻辑
 * - 为业务层提供可组合的底层能力
 *
 * 主要导出：
 * - `ImageBedFieldType`、`ImageBedField`、`UploadProgressHandler`、`UploadOptions`、`TransferOptions`、`UploadResult`
 *
 * 依赖关系：
 * - 上游依赖：`../../types/imageBed`
 * - 下游影响：供业务上传与迁移流程调用
 */

import { ImageBedConfig, ImageBedProvider } from '../../types/imageBed';

export type ImageBedFieldType = 'text' | 'select' | 'switch' | 'password';

export type ImageBedField = {
  key: keyof ImageBedConfig;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: ImageBedFieldType;
  options?: Array<{ label: string; value: string }>;
  helper?: string;
};

export type UploadProgressHandler = (percent: number) => void;

export type UploadOptions = {
  onProgress?: UploadProgressHandler;
  extensionHint?: string;
};

export type TransferOptions = {
  onUploadProgress?: UploadProgressHandler;
};

export type UploadResult = {
  url: string;
  objectKey: string;
};

export type ImageBedProviderDefinition = {
  provider: ImageBedProvider;
  label: string;
  description: string;
  fields: ImageBedField[];
  defaultConfig: ImageBedConfig;
  upload: (file: File | Blob, config: ImageBedConfig, options?: UploadOptions) => Promise<UploadResult>;
  transferImage: (sourceUrl: string, config: ImageBedConfig, options?: TransferOptions) => Promise<string>;
};
