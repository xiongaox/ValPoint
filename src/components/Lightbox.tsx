/**
 * Lightbox - 灯箱
 *
 * 职责：
 * - 渲染灯箱相关的界面结构与样式。
 * - 处理用户交互与状态变更并触发回调。
 * - 组合子组件并提供可配置项。
 */

import React, { useMemo, useEffect, useLayoutEffect, useCallback, useState, useRef } from 'react';
import Icon from './Icon';
import { LightboxImage } from '../types/ui';
import { useDeviceMode } from '../hooks/useDeviceMode';
import { useEscapeClose } from '../hooks/useEscapeClose';

type Props = {
  viewingImage: LightboxImage | null;
  setViewingImage: (v: LightboxImage | null) => void;
};

const Lightbox: React.FC<Props> = ({ viewingImage, setViewingImage }) => {
  const { isMobile, isTabletLandscape, isIPad, isPortrait } = useDeviceMode();
  const isPadPortrait = isMobile && isIPad && isPortrait;
  const isMobileLayout = isMobile && !isPadPortrait;
  const isTouchGestureMode = isMobileLayout || isPadPortrait;
  const isTabletDesktop = isTabletLandscape || isPadPortrait;

  const { src, list, index, desc, descList } = useMemo(() => {
    if (!viewingImage) {
      return { src: '', list: [], index: 0, desc: '', descList: [] };
    }
    if (typeof viewingImage === 'string') {
      return { src: viewingImage, list: [viewingImage], index: 0, desc: '', descList: [] };
    }
    return {
      src: viewingImage?.src,
      list: Array.isArray(viewingImage?.list) ? viewingImage.list.filter(Boolean) : [],
      index: typeof viewingImage?.index === 'number' ? viewingImage.index : 0,
      desc: viewingImage?.desc || '',
      descList: Array.isArray(viewingImage?.descList) ? viewingImage.descList : [],
    };
  }, [viewingImage]);

  const hasList = list && list.length > 1;
  const currentIndex = hasList ? Math.min(Math.max(index, 0), list.length - 1) : 0;
  const prevIndex = hasList ? (currentIndex - 1 + list.length) % list.length : -1;
  const nextIndex = hasList ? (currentIndex + 1) % list.length : -1;
  const prevSrc = hasList && prevIndex !== -1 ? list[prevIndex] : null;
  const nextSrc = hasList && nextIndex !== -1 ? list[nextIndex] : null;

  const getNextIndex = useCallback(() => (currentIndex + 1) % list.length, [currentIndex, list.length]);
  const getPrevIndex = useCallback(() => (currentIndex - 1 + list.length) % list.length, [currentIndex, list.length]);

  const goPrev = useCallback(() => {
    if (!hasList) return;
    const newIndex = getPrevIndex();
    setViewingImage({ src: list[newIndex], list, index: newIndex, desc: descList[newIndex] || '', descList });
  }, [hasList, getPrevIndex, list, setViewingImage, descList]);

  const goNext = useCallback(() => {
    if (!hasList) return;
    const newIndex = getNextIndex();
    setViewingImage({ src: list[newIndex], list, index: newIndex, desc: descList[newIndex] || '', descList });
  }, [hasList, getNextIndex, list, setViewingImage, descList]);

  const close = useCallback(() => {
    setViewingImage(null);
  }, [setViewingImage]);

  useEscapeClose(Boolean(viewingImage), close);

  useEffect(() => {
    if (!viewingImage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key.toLowerCase()) {
        case 'a': e.preventDefault(); goPrev(); break;
        case 'd': e.preventDefault(); goNext(); break;
        case 'q': e.preventDefault(); close(); break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [viewingImage, goPrev, goNext, close]);

  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const touchStartTime = useRef<number>(0);
  const lastValidTapEndTime = useRef<number>(0);

  const [isPinching, setIsPinching] = useState(false);

  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [dragY, setDragY] = useState(0);
  const [isDraggingVertical, setIsDraggingVertical] = useState(false);

  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [startPinchDist, setStartPinchDist] = useState<number | null>(null);
  const [startPinchCenter, setStartPinchCenter] = useState<{ x: number, y: number } | null>(null);
  const [startScale, setStartScale] = useState(1);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  const MAX_SCALE = 3;

  const [showHint, setShowHint] = useState(false);
  const [isTouchSwapAnimating, setIsTouchSwapAnimating] = useState(false);
  const touchSwapTimerRef = useRef<number | null>(null);
  const wheelNavLockRef = useRef<number>(0);

  // 说明：描述文字样式状态
  const [textStyleOpen, setTextStyleOpen] = useState(false);
  const [textStyle, setTextStyle] = useState({
    position: 20, // 距离顶部百分比
    fontSize: 48, // 字体大小 px
    color: '#ff0000', // 字体颜色
    strokeColor: '#ffffff', // 描边颜色
    strokeWidth: 4, // 描边粗细
    shadow: true, // 是否显示阴影
  });

  useEffect(() => {
    if (isTouchGestureMode && viewingImage) {
      setShowHint(true);
    }
  }, [isTouchGestureMode, viewingImage]);

  useEffect(() => {
    return () => {
      if (touchSwapTimerRef.current !== null) {
        window.clearTimeout(touchSwapTimerRef.current);
        touchSwapTimerRef.current = null;
      }
    };
  }, []);


  useLayoutEffect(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setDragY(0);
    setIsDraggingVertical(false);
    setIsPinching(false);

    setIsResetting(true);
    setSwipeOffset(0);
    setIsSwiping(false);

    requestAnimationFrame(() => {
      setIsResetting(false);
    });
  }, [src]);

  const minFlickVelocity = 0.5; // 说明：单位为 px/ms。

  const triggerTouchSwapAnimation = useCallback(() => {
    if (touchSwapTimerRef.current !== null) {
      window.clearTimeout(touchSwapTimerRef.current);
    }
    setIsTouchSwapAnimating(true);
    touchSwapTimerRef.current = window.setTimeout(() => {
      setIsTouchSwapAnimating(false);
      touchSwapTimerRef.current = null;
    }, 150);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();

    const dominantDelta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (dominantDelta === 0) {
      return;
    }

    // Ctrl/Meta + 滚轮 或 已处于缩放状态时，优先做缩放。
    if (e.ctrlKey || e.metaKey || scale > 1) {
      const zoomStep = dominantDelta < 0 ? 0.14 : -0.14;
      const nextScale = Math.max(1, Math.min(MAX_SCALE, scale + zoomStep));
      setScale(nextScale);
      if (nextScale === 1) {
        setPan({ x: 0, y: 0 });
      }
      return;
    }

    if (!hasList) {
      return;
    }

    const now = Date.now();
    if (now - wheelNavLockRef.current < 160) {
      return;
    }
    wheelNavLockRef.current = now;

    if (dominantDelta > 0 && nextSrc) {
      triggerTouchSwapAnimation();
      goNext();
    } else if (dominantDelta < 0 && prevSrc) {
      triggerTouchSwapAnimation();
      goPrev();
    }
  }, [goNext, goPrev, hasList, nextSrc, prevSrc, scale, triggerTouchSwapAnimation]);

  const getDistance = (touches: React.TouchList) => {
    return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
  };

  const getCenter = (touches: React.TouchList) => {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2 - window.innerWidth / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2 - window.innerHeight / 2
    };
  };

  const handleDoubleTap = (e: React.TouchEvent) => {
    const tapX = e.touches[0].clientX - window.innerWidth / 2;
    const tapY = e.touches[0].clientY - window.innerHeight / 2;

    if (scale > 1) {
      setScale(1);
      setPan({ x: 0, y: 0 });
    } else {
      const targetScale = 2.5;
      const newPanX = -tapX * (targetScale - 1);
      const newPanY = -tapY * (targetScale - 1);

      setScale(targetScale);
      setPan({ x: newPanX, y: newPanY });
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (showHint) setShowHint(false);

    const now = Date.now();

    if (e.touches.length === 1) {
      if (now - lastValidTapEndTime.current < 300) {
        handleDoubleTap(e);
        lastValidTapEndTime.current = 0;
        return;
      }

      touchStartTime.current = now;
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });

      if (scale > 1) {
        setStartPan({ ...pan });
      } else {
        setIsResetting(false);
      }
    } else if (e.touches.length === 2) {
      const dist = getDistance(e.touches);
      const center = getCenter(e.touches);
      setStartPinchDist(dist);
      setStartScale(scale);
      setStartPinchCenter(center);
      setStartPan(pan);
      setIsPinching(true);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && startPinchDist && startPinchCenter) {
      const dist = getDistance(e.touches);
      const center = getCenter(e.touches);

      let newScale = startScale * (dist / startPinchDist);

      if (newScale > MAX_SCALE) {
        const excess = newScale - MAX_SCALE;
        newScale = MAX_SCALE + excess * 0.3;
      }
      if (newScale < 1) {
        const deficiency = 1 - newScale;
        newScale = 1 - deficiency * 0.3;
      }

      const ratio = newScale / startScale;
      const newPanX = center.x - (startPinchCenter.x - startPan.x) * ratio;
      const newPanY = center.y - (startPinchCenter.y - startPan.y) * ratio;

      setScale(newScale);
      setPan({ x: newPanX, y: newPanY });

    } else if (e.touches.length === 1 && touchStart) {
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = currentX - touchStart.x;
      const deltaY = currentY - touchStart.y;

      if (scale === 1) {
        if (!isDraggingVertical && !isSwiping) {
          if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
            setIsDraggingVertical(true); // 说明：锁定为垂直方向。
          } else if (Math.abs(deltaX) > 10) {
            setIsSwiping(true); // 说明：锁定为水平方向。
          }
        }

        if (isDraggingVertical) {
          setDragY(deltaY);
          e.preventDefault();
        } else if (isSwiping) {
          if ((deltaX > 0 && !prevSrc) || (deltaX < 0 && !nextSrc)) {
            setSwipeOffset(deltaX * 0.3);
          } else {
            setSwipeOffset(deltaX);
          }
        }
      } else {
        handleZoomPan(e.touches[0].clientX, e.touches[0].clientY, deltaX, deltaY);
      }
    }
  };

  const handleZoomPan = (cx: number, cy: number, dx: number, dy: number) => {
    const potentialPanX = startPan.x + dx;
    const potentialPanY = startPan.y + dy;
    const maxPanX = (window.innerWidth * (scale - 1)) / 2;
    const maxPanY = (window.innerHeight * (scale - 1)) / 2;

    const clampAndDamp = (val: number, max: number) => {
      if (val > max) return max + (val - max) * 0.3;
      if (val < -max) return -max + (val + max) * 0.3;
      return val;
    };

    let pX = clampAndDamp(potentialPanX, maxPanX);
    let pY = clampAndDamp(potentialPanY, maxPanY);

    let hardClampedX = Math.min(Math.max(potentialPanX, -maxPanX), maxPanX);
    const overflowX = potentialPanX - hardClampedX;

    setPan({ x: pX, y: pY });

    if (Math.abs(overflowX) > 1) {
      if ((overflowX > 0 && !prevSrc) || (overflowX < 0 && !nextSrc)) {
        setSwipeOffset(overflowX * 0.3);
      } else {
        setSwipeOffset(overflowX);
      }
      setIsSwiping(true);
    } else {
      setSwipeOffset(0);
      setIsSwiping(false);
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    setStartPinchDist(null);
    setStartPinchCenter(null);
    setIsPinching(false);

    const now = Date.now();
    const touchDuration = now - touchStartTime.current;

    if (scale > MAX_SCALE) setScale(MAX_SCALE);
    else if (scale < 1) {
      setScale(1);
      setPan({ x: 0, y: 0 });
    }

    const isMoved = Math.abs(swipeOffset) > 10 || Math.abs(dragY) > 10 || isDraggingVertical || isSwiping;
    if (!isMoved && touchStart && touchDuration < 300) {
      lastValidTapEndTime.current = now;
    }

    if (isDraggingVertical) {
      if (Math.abs(dragY) > 100) {
        close();
      } else {
        setDragY(0);
      }
      setIsDraggingVertical(false);
      return;
    }

    let finalSwipeOffset = swipeOffset;

    if (scale <= 1 && touchStart) {
      const distanceX = e.changedTouches[0].clientX - touchStart.x;
      const velocity = Math.abs(distanceX) / touchDuration;

      if ((isSwiping || Math.abs(distanceX) > 20) && velocity > minFlickVelocity) {
        if (distanceX > 0) finalSwipeOffset = window.innerWidth;
        else finalSwipeOffset = -window.innerWidth;
      } else {
        finalSwipeOffset = distanceX;
      }
    }

    const threshold = window.innerWidth * 0.25;
    setIsSwiping(false);

    if (Math.abs(finalSwipeOffset) > threshold || (Math.abs(swipeOffset) > threshold && scale > 1)) {
      const checkOffset = scale > 1 ? swipeOffset : finalSwipeOffset;

      // 触控模式（移动端 / iPad 竖屏）直接切图，避免过渡阶段闪烁。
      if (isTouchGestureMode) {
        if (checkOffset < 0 && nextSrc) {
          triggerTouchSwapAnimation();
          goNext();
        } else if (checkOffset > 0 && prevSrc) {
          triggerTouchSwapAnimation();
          goPrev();
        }
        setSwipeOffset(0);
        setTouchStart(null);
        return;
      }

      if (checkOffset < 0 && nextSrc) {
        setSwipeOffset(-window.innerWidth);
        setTimeout(() => goNext(), 300);
      } else if (checkOffset > 0 && prevSrc) {
        setSwipeOffset(window.innerWidth);
        setTimeout(() => goPrev(), 300);
      } else {
        setSwipeOffset(0);
      }
    } else {
      setSwipeOffset(0);
    }

    setTouchStart(null);
  };

  if (!viewingImage) return null;

  const bgOpacity = 1 - Math.min(Math.abs(dragY) / 300, 0.8);
  const isTouching = touchStart !== null || isPinching;
  const shouldDisableMotionTransition = isTouching || isSwiping || isResetting || isDraggingVertical;
  const imageMaxHeightClass = isTabletDesktop ? 'max-h-[72vh]' : 'max-h-[80vh]';
  const bottomBarClass = isTouchGestureMode
    ? 'fixed bottom-0 w-full px-2 pb-6 pt-4 tablet-bottom-safe bg-gradient-to-t from-black/90 via-black/60 to-transparent'
    : (isTabletDesktop ? 'fixed bottom-4 gap-4 px-3' : 'fixed bottom-8');
  const closeButtonClass = isTabletDesktop ? 'top-4 right-4 w-10 h-10' : 'top-6 right-6 w-12 h-12';
  const styleToggleTopClass = isTabletDesktop ? 'top-[64px] right-4' : 'top-[88px] right-6';

  return (
    <div
      className="fixed inset-0 z-[2000] flex flex-col items-center justify-center cursor-zoom-out touch-none overflow-hidden transition-colors"
      style={{ backgroundColor: `rgba(0, 0, 0, ${bgOpacity * 0.95})` }}
      onClick={close}
      onWheel={handleWheel}
    >

      <div
        className="absolute inset-0 flex items-center justify-center transition-transform ease-out will-change-transform"
        style={{
          transform: `translateX(${swipeOffset}px) translateY(${dragY}px) scale(${1 - Math.abs(dragY) / 1000}) translateZ(0)`,
          transitionDuration: shouldDisableMotionTransition ? '0ms' : '300ms',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {prevSrc && (
          <div className="absolute left-0 top-0 w-full h-full -translate-x-full flex items-center justify-center p-4">
            <img src={prevSrc} className={`${imageMaxHeightClass} max-w-full object-contain pointer-events-none`} />
          </div>
        )}

        <div className="relative w-full h-full flex items-center justify-center p-4">
          <img
            src={src}
            className={`${imageMaxHeightClass} max-w-full object-contain will-change-transform`}
            onClick={(e) => e.stopPropagation()}
            style={{
              transform: `scale(${scale}) translate(${pan.x / scale}px, ${pan.y / scale}px) translateZ(0)`,
              transition: shouldDisableMotionTransition
                ? 'opacity 150ms ease-out'
                : 'transform 300ms cubic-bezier(0.25, 0.8, 0.25, 1), opacity 150ms ease-out',
              opacity: isTouchSwapAnimating ? 0.88 : 1,
              WebkitBackfaceVisibility: 'hidden',
              backfaceVisibility: 'hidden',
            }}
          />
          {/* 说明：描述文字叠加层 */}
          {desc && (
            <div
              className="absolute left-0 right-0 pointer-events-none flex justify-center px-4"
              style={{
                top: `${textStyle.position}%`,
                // 移动端：文字不随图片缩放/平移，保持固定位置
                transform: isTouchGestureMode
                  ? 'translateY(-50%)'
                  : `translateY(-50%) scale(${scale}) translate(${pan.x / scale}px, ${pan.y / scale}px)`,
                transition: shouldDisableMotionTransition ? 'none' : 'transform 300ms cubic-bezier(0.25, 0.8, 0.25, 1)'
              }}
            >
              <span
                className="font-black tracking-wide text-center inline-block"
                style={{
                  fontSize: `${isTouchGestureMode ? textStyle.fontSize * 0.6 : (isTabletDesktop ? textStyle.fontSize * 0.85 : textStyle.fontSize)}px`,
                  color: textStyle.color,
                  textShadow: (() => {
                    const baseW = textStyle.strokeWidth;
                    const w = isTouchGestureMode ? baseW * 0.6 : (isTabletDesktop ? baseW * 0.8 : baseW);
                    const c = textStyle.strokeColor;
                    // 使用更多层阴影实现平滑圆角描边
                    const shadows: string[] = [];
                    const steps = 24; // 更多步数 = 更平滑
                    for (let i = 0; i < steps; i++) {
                      const angle = (i / steps) * Math.PI * 2;
                      const x = Math.cos(angle) * w;
                      const y = Math.sin(angle) * w;
                      shadows.push(`${x.toFixed(2)}px ${y.toFixed(2)}px 0 ${c}`);
                    }
                    // 额外添加半径的层，填充中间空隙
                    const halfW = w * 0.5;
                    for (let i = 0; i < 12; i++) {
                      const angle = (i / 12) * Math.PI * 2;
                      const x = Math.cos(angle) * halfW;
                      const y = Math.sin(angle) * halfW;
                      shadows.push(`${x.toFixed(2)}px ${y.toFixed(2)}px 0 ${c}`);
                    }
                    if (textStyle.shadow) {
                      shadows.push('0 0 12px rgba(0,0,0,0.8)');
                    }
                    return shadows.join(', ');
                  })(),
                }}
              >
                {desc}
              </span>
            </div>
          )}
        </div>

        {nextSrc && (
          <div className="absolute left-0 top-0 w-full h-full translate-x-full flex items-center justify-center p-4">
            <img src={nextSrc} className={`${imageMaxHeightClass} max-w-full object-contain pointer-events-none`} />
          </div>
        )}
      </div>

      <div
        className={`shrink-0 flex items-center justify-center gap-6 z-20 transition-opacity duration-200 ${isDraggingVertical ? 'opacity-0' : 'opacity-100'} ${bottomBarClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {!isTouchGestureMode && (
          <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
            <div className="w-8 h-8 rounded-md bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-xs shadow-lg backdrop-blur-sm">A</div>
            <span className="text-white/70 text-sm">上一张</span>
          </div>
        )}

        {hasList && (
          <div className={`flex items-center gap-3 px-4 py-2 rounded-full border border-white/15 ${isTouchGestureMode
            ? 'overflow-x-auto w-fit mx-auto max-w-full scrollbar-hide bg-transparent border-none'
            : 'bg-black/70 backdrop-blur-md'
            }`}>
            {!isTouchGestureMode && (
              <button
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-[#ff4655] text-white transition-colors border border-white/15 shrink-0"
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                title="上一张 (A)"
              >
                <Icon name="ChevronLeft" size={22} />
              </button>
            )}

            <div className="flex items-center gap-2">
              {list.map((thumbSrc, idx) => (
                <button
                  key={thumbSrc + idx}
                  className={`w-16 h-10 rounded overflow-hidden border shrink-0 ${idx === currentIndex ? 'border-[#ff4655]' : 'border-white/15'} bg-black/40 hover:border-[#ff4655] transition-colors`}
                  onClick={(e) => { e.stopPropagation(); setViewingImage({ src: thumbSrc, list, index: idx, desc: descList[idx] || '', descList }); }}
                >
                  <img src={thumbSrc} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {!isTouchGestureMode && (
              <button
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-[#ff4655] text-white transition-colors border border-white/15 shrink-0"
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                title="下一张 (D)"
              >
                <Icon name="ChevronRight" size={22} />
              </button>
            )}
          </div>
        )}

        {!isTouchGestureMode && (
          <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
            <div className="w-8 h-8 rounded-md bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-xs shadow-lg backdrop-blur-sm">D</div>
            <span className="text-white/70 text-sm">下一张</span>
          </div>
        )}
      </div>

      <button
        className={`absolute ${closeButtonClass} flex items-center justify-center bg-black/60 hover:bg-[#ff4655] rounded-full text-white transition-all backdrop-blur-md border border-white/20 z-50 ${isDraggingVertical ? 'opacity-0' : 'opacity-100'}`}
        onClick={(e) => { e.stopPropagation(); close(); }}
        title="关闭 (Q)"
      >
        <Icon name="X" size={isTabletDesktop ? 22 : 28} />
      </button>

      {/* 说明：文字样式按钮 - 在关闭按钮下方（仅桌面端显示） */}
      {desc && !isTouchGestureMode && (
        <div className={`absolute ${styleToggleTopClass} z-50`}>
          <button
            className={`${isTabletDesktop ? 'w-10 h-10' : 'w-12 h-12'} flex items-center justify-center bg-emerald-500/20 hover:bg-emerald-500/40 rounded-full text-emerald-400 transition-all backdrop-blur-md border border-emerald-500/40 ${isDraggingVertical ? 'opacity-0' : 'opacity-100'}`}
            onClick={(e) => { e.stopPropagation(); setTextStyleOpen(!textStyleOpen); }}
            title="文字样式"
          >
            <Icon name="Type" size={isTabletDesktop ? 20 : 24} />
          </button>

          {/* 说明：样式控制弹窗 */}
          {textStyleOpen && (
            <div
              className={`absolute top-0 ${isTabletDesktop ? 'right-12 w-64' : 'right-14 w-72'} bg-black/90 backdrop-blur-md rounded-xl border border-white/15 p-4 shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-bold text-sm">描述文字样式</span>
                <button
                  className="text-gray-400 hover:text-white transition-colors"
                  onClick={() => setTextStyleOpen(false)}
                >
                  <Icon name="X" size={16} />
                </button>
              </div>

              <div className="space-y-4">
                {/* 位置 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">位置（距顶部）</span>
                    <span className="text-white font-mono">{textStyle.position}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={textStyle.position}
                    onChange={(e) => setTextStyle(prev => ({ ...prev, position: parseInt(e.target.value) }))}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500"
                  />
                </div>

                {/* 字体大小 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">字体大小</span>
                    <span className="text-white font-mono">{textStyle.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="16"
                    max="72"
                    value={textStyle.fontSize}
                    onChange={(e) => setTextStyle(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500"
                  />
                </div>

                {/* 颜色 */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <span className="text-gray-400 text-xs">字体颜色</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={textStyle.color}
                        onChange={(e) => setTextStyle(prev => ({ ...prev, color: e.target.value }))}
                        className="w-8 h-8 rounded cursor-pointer border border-white/20"
                      />
                      <span className="text-white text-xs font-mono">{textStyle.color}</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="text-gray-400 text-xs">描边颜色</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={textStyle.strokeColor}
                        onChange={(e) => setTextStyle(prev => ({ ...prev, strokeColor: e.target.value }))}
                        className="w-8 h-8 rounded cursor-pointer border border-white/20"
                      />
                      <span className="text-white text-xs font-mono">{textStyle.strokeColor}</span>
                    </div>
                  </div>
                </div>

                {/* 描边粗细 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">描边粗细</span>
                    <span className="text-white font-mono">{textStyle.strokeWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="6"
                    value={textStyle.strokeWidth}
                    onChange={(e) => setTextStyle(prev => ({ ...prev, strokeWidth: parseInt(e.target.value) }))}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500"
                  />
                </div>

                {/* 阴影开关 */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-xs">文字阴影</span>
                  <button
                    className={`w-10 h-5 rounded-full transition-colors ${textStyle.shadow ? 'bg-emerald-500' : 'bg-white/20'}`}
                    onClick={() => setTextStyle(prev => ({ ...prev, shadow: !prev.shadow }))}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${textStyle.shadow ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div
        className={`fixed bottom-24 left-0 right-0 flex justify-center pointer-events-none transition-opacity duration-500 z-30 ${showHint ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="bg-black/60 backdrop-blur-md text-white/90 text-xs px-4 py-1.5 rounded-full border border-white/10 shadow-lg">
          双击缩放 · 双指调整 · 下拉关闭
        </div>
      </div>
    </div>
  );
};

export default Lightbox;
