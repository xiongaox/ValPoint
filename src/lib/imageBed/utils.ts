/**
 * utils - 基础库(imageBed)
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
 * - `trimSlashes`、`ensureProcessParams`、`ensureHttps`、`buildDateSegments`、`buildTimestampName`、`generateUUID`
 *
 * 依赖关系：
 * - 上游依赖：无显式外部模块依赖
 * - 下游影响：供业务上传与迁移流程调用
 */

export const trimSlashes = (value = '') => value.replace(/^\/+|\/+$/g, '');

export const ensureProcessParams = (processParams?: string) => {
  if (!processParams) return '';
  if (processParams.startsWith('?') || processParams.startsWith('&')) return processParams;
  return `?${processParams}`;
};

export const ensureHttps = (url: string) => url.replace(/^http:\/\//i, 'https://');

const pad = (num: number, len = 2) => num.toString().padStart(len, '0');

export const buildDateSegments = () => {
  const d = new Date();
  return [d.getFullYear().toString(), pad(d.getMonth() + 1), pad(d.getDate())];
};

export const buildTimestampName = () => {
  const d = new Date();
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds()) +
    pad(d.getMilliseconds(), 3)
  );
};

export const generateUUID = (): string => {
  return crypto.randomUUID().replace(/-/g, '');
};

export const buildSecureObjectKey = (basePath: string | undefined, extension?: string): string => {
  const prefix = trimSlashes(basePath || '');
  let fileName = generateUUID();

  if (extension) {
    fileName = `${fileName}.${extension.replace(/^\./, '')}`; // 确保不重复点号
  }

  if (prefix) {
    return `${prefix}/${fileName}`;
  }
  return fileName;
};

export const appendTimestamp = (url: string) => {
  const hasQuery = url.includes('?');
  return `${url}${hasQuery ? '&' : '?'}t=${Date.now()}`;
};

export const inferExtensionFromFile = (file: File | Blob): string => {
  if ('name' in file && file.name) {
    const extFromName = file.name.split('.').pop();
    if (extFromName) return extFromName;
  }
  if (file.type?.includes('/')) {
    const extFromType = file.type.split('/').pop();
    if (extFromType) return extFromType;
  }
  return 'png';
};

export const inferExtensionFromBlob = (blob: Blob, originalUrl: string): string => {
  if (blob.type?.includes('/')) {
    const ext = blob.type.split('/').pop();
    if (ext) return ext;
  }
  const clean = originalUrl.split('#')[0].split('?')[0];
  const parts = clean.split('.');
  if (parts.length > 1) {
    const extFromUrl = parts.pop();
    if (extFromUrl && extFromUrl.length <= 5) return extFromUrl;
  }
  return 'png';
};

export const downloadImageBlob = async (sourceUrl: string) => {
  const urlWithTs = appendTimestamp(sourceUrl);
  const response = await fetch(urlWithTs, { method: 'GET', mode: 'cors', cache: 'no-store' });
  if (!response.ok) throw new Error(`DOWNLOAD_${response.status}`);
  const blob = await response.blob();
  const extension = inferExtensionFromBlob(blob, sourceUrl);
  return { blob, extension };
};
