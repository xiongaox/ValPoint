/**
 * tencent - 基础库(provider)
 *
 * 模块定位：
 * - 所在层级：基础库(provider)
 * - 主要目标：封装各图床厂商适配实现
 *
 * 关键职责：
 * - 实现各厂商上传/转存差异逻辑
 * - 统一输入输出协议并处理 provider 细节
 * - 对上层隐藏 SDK 差异
 *
 * 主要导出：
 * - `tencentDefinition`
 *
 * 依赖关系：
 * - 上游依赖：`cos-js-sdk-v5`、`../types`、`../../../types/imageBed`
 * - 下游影响：供 imageBed 统一入口调度
 */

import COS from 'cos-js-sdk-v5';
import { ImageBedProviderDefinition, UploadOptions, TransferOptions, UploadResult } from '../types';
import { ImageBedConfig } from '../../../types/imageBed';
import {
  ensureHttps,
  buildSecureObjectKey,
  inferExtensionFromFile,
  downloadImageBlob,
} from '../utils';

const createCosClient = (config: ImageBedConfig) => {
  const { secretId, secretKey } = config;
  if (!secretId || !secretKey) {
    throw new Error('Missing required config: secretId and secretKey are required');
  }
  return new COS({
    SecretId: secretId,
    SecretKey: secretKey,
  });
};

const buildObjectKey = (basePath: string | undefined, extension?: string) => {
  return buildSecureObjectKey(basePath, extension);
};

const buildPublicUrl = (config: ImageBedConfig, objectKey: string) => {
  const { bucket, appId, area, customUrl, options, slim } = config;

  let baseUrl: string;
  if (customUrl) {
    baseUrl = customUrl.replace(/\/+$/g, '');
  } else {
    baseUrl = `https://${bucket}-${appId}.cos.${area}.myqcloud.com`;
  }

  const url = `${ensureHttps(baseUrl)}/${objectKey}`;

  const params: string[] = [];

  if (slim) {
    params.push('imageslim');
  }

  if (options) {
    params.push(options);
  }

  if (params.length > 0) {
    return `${url}?${params.join('&')}`;
  }

  return url;
};

const uploadWithRetry = async (
  cos: COS,
  bucket: string,
  area: string,
  objectKey: string,
  blob: Blob,
  onProgress?: (percent: number) => void,
) => {
  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await new Promise<{ Location: string }>((resolve, reject) => {
        cos.putObject(
          {
            Bucket: bucket,
            Region: area,
            Key: objectKey,
            Body: blob,
            onProgress: (progressData) => {
              if (onProgress) {
                const percent = Math.round(progressData.percent * 100);
                onProgress(Math.min(100, Math.max(0, percent)));
              }
            },
          },
          (err, data) => {
            if (err) reject(err);
            else resolve(data);
          },
        );
      });
      return result;
    } catch (err) {
      if (attempt === maxAttempts) throw err;
    }
  }
  throw new Error('Upload retry failed after all attempts');
};

const uploadBlobToCos = async (
  blob: Blob,
  config: ImageBedConfig,
  options: UploadOptions = {},
): Promise<UploadResult> => {
  const { bucket, appId, area } = config;
  if (!bucket || !appId || !area) {
    throw new Error('Missing required config: bucket, appId and area (Region) are required');
  }

  const cos = createCosClient(config);
  const objectKey = buildObjectKey(config.path, options.extensionHint);

  const fullBucket = bucket.includes(appId) ? bucket : `${bucket}-${appId}`;

  await uploadWithRetry(cos, fullBucket, area, objectKey, blob, options.onProgress);
  const url = buildPublicUrl(config, objectKey);

  return { url, objectKey };
};

export const tencentDefinition: ImageBedProviderDefinition = {
  provider: 'tencent',
  label: '腾讯云',
  description: '使用腾讯云 COS 作为图床',
  defaultConfig: {
    provider: 'tencent',
    _configName: '',
    secretId: '',
    secretKey: '',
    bucket: '',
    appId: '',
    area: '',
    path: '',
    customUrl: '',
    version: 'v5',
    options: '',
    slim: false,
  },
  fields: [
    { key: '_configName', label: '配置名称', required: true, placeholder: '用于区分不同图床配置' },
    { key: 'secretId', label: 'secretId', required: true, type: 'password' },
    { key: 'secretKey', label: 'secretKey', required: true, type: 'password' },
    { key: 'bucket', label: '存储桶名', required: true, placeholder: '不含 appId 后缀' },
    { key: 'appId', label: 'appId', required: true, placeholder: '例如：1250000000' },
    { key: 'area', label: '存储区域', required: true, placeholder: '如：ap-guangzhou' },
    { key: 'path', label: '自定义存储路径', placeholder: '如：img/' },
    { key: 'customUrl', label: '自定义域名', placeholder: '需包含 http:// 或 https://' },
    {
      key: 'version',
      label: 'COS 版本',
      type: 'select',
      options: [
        { label: 'v5', value: 'v5' },
        { label: 'v4', value: 'v4' },
      ],
      required: true,
    },
    { key: 'options', label: '图片处理参数', placeholder: '如：imageMogr2/thumbnail/500x500' },
    { key: 'slim', label: '开启极智压缩', type: 'switch' },
  ],
  upload: async (file: File | Blob, config: ImageBedConfig, options: UploadOptions = {}) => {
    const extensionHint = options.extensionHint || inferExtensionFromFile(file);
    return uploadBlobToCos(file, config, { ...options, extensionHint });
  },
  transferImage: async (sourceUrl: string, config: ImageBedConfig, options: TransferOptions = {}) => {
    const { blob, extension } = await downloadImageBlob(sourceUrl);
    const { url } = await uploadBlobToCos(blob, config, {
      extensionHint: extension,
      onProgress: options.onUploadProgress,
    });
    return ensureHttps(url);
  },
};
