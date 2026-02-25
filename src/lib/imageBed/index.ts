/**
 * index - 基础库(imageBed)
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
 * - `imageBedProviderDefinitions`、`imageBedProviderMap`、`defaultImageBedConfig`、`uploadImage`、`transferImage`
 *
 * 依赖关系：
 * - 上游依赖：`../../types/imageBed`、`./types`、`./providers/aliyun`、`./providers/tencent`
 * - 下游影响：供业务上传与迁移流程调用
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
