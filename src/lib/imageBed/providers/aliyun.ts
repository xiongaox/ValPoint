/**
 * aliyun - aliyun
 *
 * 职责：
 * - 承载aliyun相关的模块实现。
 * - 组织内部依赖与导出接口。
 * - 为上层功能提供支撑。
 */

import OSS from 'ali-oss';
import { ImageBedProviderDefinition, UploadOptions, TransferOptions, UploadResult } from '../types';
import { ImageBedConfig } from '../../../types/imageBed';
import {
  trimSlashes,
  ensureProcessParams,
  ensureHttps,
  buildSecureObjectKey,
  inferExtensionFromFile,
  downloadImageBlob,
} from '../utils';

const buildObjectKey = (basePath: string | undefined, extension?: string) => {
  return buildSecureObjectKey(basePath, extension);
};

const createOssClient = (config: ImageBedConfig) => {
  const region = config.region || config.area;
  const { accessKeyId, accessKeySecret, bucket } = config;
  if (!accessKeyId || !accessKeySecret || !bucket || !region) {
    throw new Error('MISSING_CONFIG');
  }
  return new OSS({
    accessKeyId,
    accessKeySecret,
    bucket,
    region,
    secure: true,
    timeout: 60000,
  });
};

const buildPublicUrl = (config: ImageBedConfig, objectKey: string) => {
  const region = config.region || config.area || '';
  const domain = config.customDomain || config.customUrl || `https://${config.bucket}.${region}.aliyuncs.com`;
  const baseUrl = domain.replace(/\/+$/g, '');
  const endpointPath = trimSlashes(config.endpointPath || '');
  const path = [endpointPath, objectKey].filter(Boolean).join('/');
  return `${ensureHttps(baseUrl)}/${path}${ensureProcessParams(config.processParams)}`;
};

const uploadWithRetry = async (
  client: OSS,
  objectKey: string,
  blob: Blob,
  onProgress?: (percent: number) => void,
) => {
  const useMultipart = blob.size > 4 * 1024 * 1024;
  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      if (useMultipart) {
        const result = await client.multipartUpload(objectKey, blob, {
          progress: (percent: number) => {
            if (onProgress) onProgress(Math.min(100, Math.max(0, Math.round(percent * 100))));
          },
          partSize: 512 * 1024,
          timeout: 60000,
        });
        return result;
      }
      const putResult = await client.put(objectKey, blob);
      if (onProgress) onProgress(100);
      return putResult;
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      console.warn('[aliyun] upload retry', { objectKey, attempt, err });
    }
  }
  throw new Error('UPLOAD_RETRY_FAILED');
};

const uploadBlobToOss = async (
  blob: Blob,
  config: ImageBedConfig,
  options: UploadOptions = {},
): Promise<UploadResult> => {
  const client = createOssClient(config);
  const objectKey = buildObjectKey(config.basePath || config.path, options.extensionHint);
  const result = await uploadWithRetry(client, objectKey, blob, options.onProgress);
  const finalKey = (result as any).name || objectKey;
  const url = buildPublicUrl(config, finalKey);
  return { url, objectKey: finalKey };
};

export const aliyunDefinition: ImageBedProviderDefinition = {
  provider: 'aliyun',
  label: '阿里云',
  description: '使用阿里云对象存储作为图床',
  defaultConfig: {
    provider: 'aliyun',
    _configName: '',
    accessKeyId: '',
    accessKeySecret: '',
    bucket: '',
    area: '',
    path: '',
    customUrl: '',
    region: '',
    basePath: '',
    customDomain: '',
  },
  fields: [
    { key: '_configName', label: '配置名称', required: true, placeholder: '用于区分不同图床配置' },
    { key: 'accessKeyId', label: 'accessKeyId', required: true },
    { key: 'accessKeySecret', label: 'accessKeySecret', required: true },
    { key: 'bucket', label: '存储空间名', required: true },
    { key: 'area', label: '存储区域代号', required: true, placeholder: '如：oss-cn-hangzhou' },
    { key: 'path', label: '自定义存储路径', placeholder: '如：img/' },
    { key: 'customUrl', label: '自定义域名', placeholder: '需包含 http:// 或 https://' },
  ],
  upload: async (file: File | Blob, config: ImageBedConfig, options: UploadOptions = {}) => {
    const extensionHint = options.extensionHint || inferExtensionFromFile(file);
    return uploadBlobToOss(file, config, { ...options, extensionHint });
  },
  transferImage: async (sourceUrl: string, config: ImageBedConfig, options: TransferOptions = {}) => {
    const { blob, extension } = await downloadImageBlob(sourceUrl);
    const { url } = await uploadBlobToOss(blob, config, {
      extensionHint: extension,
      onProgress: options.onUploadProgress,
    });
    return ensureHttps(url);
  },
};
