/**
 * qiniu - qiniu
 *
 * 职责：
 * - 承载qiniu相关的模块实现。
 * - 组织内部依赖与导出接口。
 * - 为上层功能提供支撑。
 */

import * as qiniu from 'qiniu-js';
import CryptoJS from 'crypto-js';
import { ImageBedProviderDefinition, UploadOptions, TransferOptions, UploadResult } from '../types';
import { ImageBedConfig } from '../../../types/imageBed';
import {
  ensureHttps,
  buildSecureObjectKey,
  inferExtensionFromFile,
  downloadImageBlob,
} from '../utils';

const base64UrlSafeEncode = (str: string): string => {
  return str.replace(/\+/g, '-').replace(/\//g, '_');
};

const generateUploadToken = (accessKey: string, secretKey: string, bucket: string, key?: string): string => {
  const putPolicy = {
    scope: key ? `${bucket}:${key}` : bucket,
    deadline: Math.floor(Date.now() / 1000) + 3600, // 说明：1 小时有效期。
  };

  const putPolicyStr = JSON.stringify(putPolicy);

  const encodedPutPolicy = base64UrlSafeEncode(CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(putPolicyStr)));

  const sign = CryptoJS.HmacSHA1(encodedPutPolicy, secretKey);

  const encodedSign = base64UrlSafeEncode(CryptoJS.enc.Base64.stringify(sign));

  return `${accessKey}:${encodedSign}:${encodedPutPolicy}`;
};

const buildObjectKey = (basePath: string | undefined, extension?: string) => {
  return buildSecureObjectKey(basePath, extension);
};

const buildPublicUrl = (config: ImageBedConfig, objectKey: string) => {
  const { url, options } = config;
  if (!url) {
    throw new Error('Missing url in config');
  }
  const baseUrl = url.replace(/\/+$/g, '');
  const fullUrl = `${baseUrl}/${objectKey}`;

  if (options) {
    const separator = options.startsWith('?') || options.startsWith('&') ? '' : '?';
    return `${fullUrl}${separator}${options}`;
  }

  return fullUrl;
};

const uploadBlobToQiniu = async (
  blob: Blob,
  config: ImageBedConfig,
  options: UploadOptions = {},
): Promise<UploadResult> => {
  const { accessKey, secretKey, bucket, area } = config;

  console.log('[qiniu] uploadBlobToQiniu start', {
    blobSize: blob.size,
    blobType: blob.type,
    config: {
      bucket,
      area,
      path: config.path,
      hasAccessKey: !!accessKey,
      hasSecretKey: !!secretKey,
      hasUrl: !!config.url,
    },
  });

  if (!accessKey || !secretKey || !bucket || !area) {
    const error = new Error('Missing required config: accessKey, secretKey, bucket and area are required');
    console.error('[qiniu] config validation failed:', { accessKey: !!accessKey, secretKey: !!secretKey, bucket, area });
    throw error;
  }

  const objectKey = buildObjectKey(config.path, options.extensionHint);

  console.log('[qiniu] generating upload token', { bucket, objectKey });

  const token = generateUploadToken(accessKey, secretKey, bucket, objectKey);

  const putExtra = {
    fname: objectKey,
    mimeType: blob.type || 'application/octet-stream',
  };

  const qiniuConfig = {
    useCdnDomain: true,
    region: (qiniu.region as any)[area] || qiniu.region.z0, // 说明：默认区域为华东。
  };

  console.log('[qiniu] upload config', { region: qiniuConfig.region, objectKey });

  const file = blob instanceof File ? blob : new File([blob], objectKey, { type: blob.type });

  const observable = qiniu.upload(file, objectKey, token, putExtra, qiniuConfig);

  return new Promise((resolve, reject) => {
    observable.subscribe({
      next: (result) => {
        console.log('[qiniu] upload progress', { percent: result.total.percent });
        if (options.onProgress) {
          options.onProgress(Math.round(result.total.percent));
        }
      },
      error: (err) => {
        console.error('[qiniu] upload error:', err);
        reject(err);
      },
      complete: (result) => {
        console.log('[qiniu] upload complete', { key: result.key, hash: result.hash });

        if (!config.url) {
          const error = new Error('Missing url config: Please configure access URL (domain) for Qiniu');
          console.error('[qiniu] missing url config');
          reject(error);
          return;
        }

        const uploadUrl = buildPublicUrl(config, result.key);
        console.log('[qiniu] upload success', { url: uploadUrl });
        resolve({ url: uploadUrl, objectKey: result.key });
      },
    });
  });
};

export const qiniuDefinition: ImageBedProviderDefinition = {
  provider: 'qiniu',
  label: '七牛云',
  description: '使用七牛云对象存储作为图床',
  defaultConfig: {
    provider: 'qiniu',
    _configName: '',
    accessKey: '',
    secretKey: '',
    bucket: '',
    url: '',
    area: '',
    options: '',
    path: '',
  },
  fields: [
    { key: '_configName', label: '配置名称', required: true, placeholder: '用于区分不同图床配置' },
    { key: 'accessKey', label: 'accessKey', required: true, type: 'password' },
    { key: 'secretKey', label: 'secretKey', required: true, type: 'password' },
    { key: 'bucket', label: '存储空间名', required: true },
    { key: 'url', label: '访问网址', required: true, placeholder: 'https://your-domain.com' },
    { key: 'area', label: '存储区域', required: true, placeholder: '如：z0 (华东)' },
    { key: 'options', label: '图片处理参数', placeholder: '如：imageView2/2/w/500' },
    { key: 'path', label: '自定义存储路径', placeholder: '如：img/' },
  ],
  upload: async (file: File | Blob, config: ImageBedConfig, options: UploadOptions = {}) => {
    const extensionHint = options.extensionHint || inferExtensionFromFile(file);
    return uploadBlobToQiniu(file, config, { ...options, extensionHint });
  },
  transferImage: async (sourceUrl: string, config: ImageBedConfig, options: TransferOptions = {}) => {
    const { blob, extension } = await downloadImageBlob(sourceUrl);
    const { url } = await uploadBlobToQiniu(blob, config, {
      extensionHint: extension,
      onProgress: options.onUploadProgress,
    });
    return url; // 说明：保持原协议，不强制 HTTPS。
  },
};
