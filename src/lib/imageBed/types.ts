/**
 * types - 类型
 *
 * 职责：
 * - 承载类型相关的模块实现。
 * - 组织内部依赖与导出接口。
 * - 为上层功能提供支撑。
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
