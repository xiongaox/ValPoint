/**
 * useDeviceMode - 设备模式判断
 *
 * 职责：
 * - 统一判定 mobile / tablet-landscape / desktop 三种布局模式。
 * - 兼容 iPadOS 桌面 UA 与横竖屏切换。
 */

import { useEffect, useState } from 'react';

const DEFAULT_BREAKPOINT = 768;

export type DeviceMode = 'mobile' | 'tablet-landscape' | 'desktop';

export interface DeviceModeState {
  mode: DeviceMode;
  isMobile: boolean;
  isTabletLandscape: boolean;
  isIPad: boolean;
  isPortrait: boolean;
}

function detectIPad(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const isClassicIPadUA = /iPad/.test(userAgent);
  const isIPadOSDesktopUA = platform === 'MacIntel' && navigator.maxTouchPoints > 1;

  return isClassicIPadUA || isIPadOSDesktopUA;
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
    mode = isPortrait ? 'mobile' : 'tablet-landscape';
  } else {
    mode = width < breakpoint ? 'mobile' : 'desktop';
  }

  return {
    mode,
    isMobile: mode === 'mobile',
    isTabletLandscape: mode === 'tablet-landscape',
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
