/**
 * imageBed - 类型层
 *
 * 模块定位：
 * - 所在层级：类型层
 * - 主要目标：集中定义跨模块共享类型
 *
 * 关键职责：
 * - 定义稳定的类型契约与字段语义
 * - 减少跨模块调用歧义
 * - 提升重构与联调时的可预期性
 *
 * 主要导出：
 * - `ImageBedProvider`、`ImageBedConfig`
 *
 * 依赖关系：
 * - 上游依赖：无显式外部模块依赖
 * - 下游影响：供全局编译期约束
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
  basePath?: string;
  endpointPath?: string;
  customDomain?: string;
  processParams?: string;
  region?: string;
};
