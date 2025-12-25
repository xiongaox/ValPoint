/**
 * imageBed/utils - 图床通用工具函数
 * 
 * 职责：
 * - 文件名与路径处理 (trimSlashes, buildTimestampName)
 * - 扩展名推断与 URL 增强 (inferExtension, appendTimestamp)
 * - 基础图片下载 Blob 处理
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
