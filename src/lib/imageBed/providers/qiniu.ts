import * as qiniu from 'qiniu-js';
import CryptoJS from 'crypto-js';
/**
 * qiniu provider - 七牛云 KODO 图床适配器
 * 
 * 实现七牛云的客户端直传和抓取（转存）功能。
 */
import { ImageBedProviderDefinition, UploadOptions, TransferOptions, UploadResult } from '../types';
import { ImageBedConfig } from '../../../types/imageBed';
import {
  trimSlashes,
  ensureHttps,
  buildTimestampName,
  inferExtensionFromFile,
  downloadImageBlob,
} from '../utils';

// Base64 URL Safe 编码
const base64UrlSafeEncode = (str: string): string => {
  return str.replace(/\+/g, '-').replace(/\//g, '_');
};

// 生成上传凭证
const generateUploadToken = (accessKey: string, secretKey: string, bucket: string, key?: string): string => {
  const putPolicy = {
    scope: key ? `${bucket}:${key}` : bucket,
    deadline: Math.floor(Date.now() / 1000) + 3600, // 1小时有效期
  };

  // 1. 将 putPolicy 转为 JSON 字符串
  const putPolicyStr = JSON.stringify(putPolicy);

  // 2. 对 JSON 字符串进行 Base64 编码
  const encodedPutPolicy = base64UrlSafeEncode(CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(putPolicyStr)));

  // 3. 使用 SecretKey 对编码后的 putPolicy 进行 HMAC-SHA1 签名
  const sign = CryptoJS.HmacSHA1(encodedPutPolicy, secretKey);

  // 4. 对签名进行 Base64 编码
  const encodedSign = base64UrlSafeEncode(CryptoJS.enc.Base64.stringify(sign));

  // 5. 拼接最终的 uploadToken
  return `${accessKey}:${encodedSign}:${encodedPutPolicy}`;
};

const buildObjectKey = (basePath: string | undefined, extension: string) => {
  const prefix = trimSlashes(basePath || '');
  const fileName = `${buildTimestampName()}.${extension}`;
  if (prefix) return `${prefix}/${fileName}`;
  return fileName;
};

const buildPublicUrl = (config: ImageBedConfig, objectKey: string) => {
  const { url, options } = config;
  if (!url) {
    throw new Error('Missing url in config');
  }
  // 保持用户配置的协议（HTTP 或 HTTPS），不强制转换
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

  const extension = options.extensionHint || 'png';
  const objectKey = buildObjectKey(config.path, extension);

  console.log('[qiniu] generating upload token', { bucket, objectKey });

  // 生成上传凭证
  const token = generateUploadToken(accessKey, secretKey, bucket, objectKey);

  // 配置上传参数
  const putExtra = {
    fname: objectKey,
    mimeType: blob.type || 'application/octet-stream',
  };

  const qiniuConfig = {
    useCdnDomain: true,
    region: (qiniu.region as any)[area] || qiniu.region.z0, // 默认华东
  };

  console.log('[qiniu] upload config', { region: qiniuConfig.region, objectKey });

  // 将 Blob 转换为 File
  const file = blob instanceof File ? blob : new File([blob], objectKey, { type: blob.type });

  // 创建 observable 对象
  const observable = qiniu.upload(file, objectKey, token, putExtra, qiniuConfig);

  // 执行上传
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

        // 必须配置访问网址才能生成完整 URL
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
    { key: 'accessKey', label: 'accessKey', required: true },
    { key: 'secretKey', label: 'secretKey', required: true },
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
    return url; // 保持原始协议，不强制转换为 HTTPS
  },
};
