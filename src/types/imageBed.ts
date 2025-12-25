/**
 * imageBed.ts - 图床配置相关类型定义
 */
export type ImageBedProvider = 'aliyun' | 'tencent' | 'qiniu';

export type ImageBedConfig = {
  provider: ImageBedProvider;
  _configName: string;
  accessKeyId?: string;
  accessKeySecret?: string;
  bucket?: string;
  area?: string;
  path?: string;
  customUrl?: string;
  secretId?: string;
  secretKey?: string;
  appId?: string;
  version?: 'v4' | 'v5';
  options?: string;
  slim?: boolean;
  accessKey?: string;
  url?: string;
  // legacy fields kept for backward compatibility with existing upload flow
  basePath?: string;
  endpointPath?: string;
  customDomain?: string;
  processParams?: string;
  region?: string;
};
