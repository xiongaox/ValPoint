/**
 * imageBed 模块 - 统一图床上传接口
 * 
 * 提供跨平台的图片上传和转存功能：
 * - 支持阿里云、腾讯云、七牛云三大平台
 * - uploadImage: 上传本地文件/Blob 到图床
 * - transferImage: 从 URL 转存图片到图床
 * 
 * 使用方式：
 * ```ts
 * import { uploadImage, transferImage } from './lib/imageBed';
 * const result = await uploadImage(file, config);
 * ```
 */
import { ImageBedProvider, ImageBedConfig } from '../../types/imageBed';
import { ImageBedProviderDefinition, UploadOptions, TransferOptions, UploadResult } from './types';
import { aliyunDefinition } from './providers/aliyun';
import { tencentDefinition } from './providers/tencent';
import { qiniuDefinition } from './providers/qiniu';

export * from './types';

export const imageBedProviderDefinitions: ImageBedProviderDefinition[] = [
  aliyunDefinition,
  tencentDefinition,
  qiniuDefinition,
];

export const imageBedProviderMap: Record<ImageBedProvider, ImageBedProviderDefinition> =
  imageBedProviderDefinitions.reduce(
    (acc, def) => {
      acc[def.provider] = def;
      return acc;
    },
    {} as Record<ImageBedProvider, ImageBedProviderDefinition>,
  );

export const defaultImageBedConfig = imageBedProviderDefinitions[0].defaultConfig;

/**
 * 统一上传接口：根据配置的 provider 调用对应平台的上传逻辑
 */
export const uploadImage = async (
  file: File | Blob,
  config: ImageBedConfig,
  options?: UploadOptions,
): Promise<UploadResult> => {
  const definition = imageBedProviderMap[config.provider];
  if (!definition) {
    throw new Error(`UNSUPPORTED_PROVIDER: ${config.provider}`);
  }
  return definition.upload(file, config, options);
};

/**
 * 统一转存接口：根据配置的 provider 调用对应平台的转存逻辑
 */
export const transferImage = async (
  sourceUrl: string,
  config: ImageBedConfig,
  options?: TransferOptions,
): Promise<string> => {
  const definition = imageBedProviderMap[config.provider];
  if (!definition) {
    throw new Error(`UNSUPPORTED_PROVIDER: ${config.provider}`);
  }
  return definition.transferImage(sourceUrl, config, options);
};
