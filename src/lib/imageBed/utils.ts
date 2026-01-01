/**
 * utils - 工具
 *
 * 职责：
 * - 承载工具相关的模块实现。
 * - 组织内部依赖与导出接口。
 * - 为上层功能提供支撑。
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
