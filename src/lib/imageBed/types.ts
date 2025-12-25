/**
 * imageBed/types - 图床模块类型定义
 * 
 * 职责：
 * - 定义图床配置字段映射 (ImageBedField)
 * - 定义各平台 Provider 的标准接口 (ImageBedProviderDefinition)
 */
import { ImageBedConfig, ImageBedProvider } from '../../types/imageBed';

export type ImageBedFieldType = 'text' | 'select' | 'switch';

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
