/**
 * useDeviceMode - 设备模式判断
 *
 * 职责：
 * - 统一判定 mobile / tablet-landscape / desktop 三种布局模式。
 * - 兼容 iPadOS 桌面 UA 与横竖屏切换。
 */

import { useEffect, useState } from 'react';

const DEFAULT_BREAKPOINT = 768;
const SIZE_TOLERANCE = 24;
const IPAD_SHORT_SIDES = [744, 768, 820, 834, 1024];
const IPAD_LONG_SIDES = [1024, 1112, 1133, 1180, 1194, 1366];

export type DeviceMode = 'mobile' | 'tablet-landscape' | 'desktop';

export interface DeviceModeState {
  mode: DeviceMode;
  isMobile: boolean;
  isTabletLandscape: boolean;
  isIPad: boolean;
  isPortrait: boolean;
}

function detectIPad(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const isClassicIPadUA = /iPad/.test(userAgent);
  const isIPadOSDesktopUA = platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  const shortSide = Math.min(window.innerWidth, window.innerHeight);
  const longSide = Math.max(window.innerWidth, window.innerHeight);
  const isKnownIPadShortSide = IPAD_SHORT_SIDES.some((size) => Math.abs(shortSide - size) <= SIZE_TOLERANCE);
  const isKnownIPadLongSide = IPAD_LONG_SIDES.some((size) => Math.abs(longSide - size) <= SIZE_TOLERANCE);
  // 兜底：兼容 DevTools 设备模拟（UA / touch points 可能不完整）。
  const isIPadLikeViewport = isKnownIPadShortSide && isKnownIPadLongSide;

  return isClassicIPadUA || isIPadOSDesktopUA || isIPadLikeViewport;
}

function getIsPortrait(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  if (typeof window.matchMedia === 'function') {
    return window.matchMedia('(orientation: portrait)').matches;
  }

  return window.innerHeight >= window.innerWidth;
}

function computeDeviceMode(breakpoint: number): DeviceModeState {
  if (typeof window === 'undefined') {
    return {
      mode: 'desktop',
      isMobile: false,
      isTabletLandscape: false,
      isIPad: false,
      isPortrait: false,
    };
  }

  const isIPad = detectIPad();
  const isPortrait = getIsPortrait();
  const width = window.innerWidth;

  let mode: DeviceMode;
  if (isIPad) {
    // 需求约束：iPad 与 Android 端功能一致（仅查看点位），统一走移动端模式。
    mode = 'mobile';
  } else {
    mode = width < breakpoint ? 'mobile' : 'desktop';
  }

  return {
    mode,
    isMobile: mode === 'mobile',
    isTabletLandscape: false,
    isIPad,
    isPortrait,
  };
}

export function useDeviceMode(breakpoint: number = DEFAULT_BREAKPOINT): DeviceModeState {
  const [state, setState] = useState<DeviceModeState>(() => computeDeviceMode(breakpoint));

  useEffect(() => {
    const handleViewportChange = () => {
      setState(computeDeviceMode(breakpoint));
    };

    const orientationQuery = window.matchMedia('(orientation: portrait)');
    handleViewportChange();

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', handleViewportChange);
    if (typeof orientationQuery.addEventListener === 'function') {
      orientationQuery.addEventListener('change', handleViewportChange);
    } else if (typeof orientationQuery.addListener === 'function') {
      orientationQuery.addListener(handleViewportChange);
    }

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleViewportChange);
      if (typeof orientationQuery.removeEventListener === 'function') {
        orientationQuery.removeEventListener('change', handleViewportChange);
      } else if (typeof orientationQuery.removeListener === 'function') {
        orientationQuery.removeListener(handleViewportChange);
      }
    };
  }, [breakpoint]);

  return state;
}

export default useDeviceMode;
