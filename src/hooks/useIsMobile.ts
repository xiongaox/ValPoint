/**
 * useIsMobile - Is移动端
 *
 * 职责：
 * - 封装Is移动端相关的状态与副作用。
 * - 对外提供稳定的接口与回调。
 * - 处理订阅、清理或缓存等生命周期细节。
 */

import { useDeviceMode } from './useDeviceMode';

const DEFAULT_BREAKPOINT = 768;

export function useIsMobile(breakpoint: number = DEFAULT_BREAKPOINT): boolean {
    const { isMobile } = useDeviceMode(breakpoint);
    return isMobile;
}

export default useIsMobile;
