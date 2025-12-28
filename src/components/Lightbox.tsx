/**
 * Lightbox - 图片全屏预览组件
 * 
 * 支持：
 * - Carousel 模式：无缝滑动切换，支持甩动 (Flick)
 * - 双指缩放 & 拖拽 (Pivot Zoom)
 * - 双击缩放 (Double Tap)
 * - 下拉关闭 (Pull to Dismiss)
 * - 键盘快捷键（A: 上一张, D: 下一张, ESC/Q: 关闭）
 */
import React, { useMemo, useEffect, useLayoutEffect, useCallback, useState, useRef } from 'react';
import Icon from './Icon';
import { LightboxImage } from '../types/ui';
import { useIsMobile } from '../hooks/useIsMobile';

type Props = {
  viewingImage: LightboxImage | null;
  setViewingImage: (v: LightboxImage | null) => void;
};

const Lightbox: React.FC<Props> = ({ viewingImage, setViewingImage }) => {
  const isMobile = useIsMobile();

  const { src, list, index } = useMemo(() => {
    if (!viewingImage) {
      return { src: '', list: [], index: 0 };
    }
    if (typeof viewingImage === 'string') {
      return { src: viewingImage, list: [viewingImage], index: 0 };
    }
    return {
      src: viewingImage?.src,
      list: Array.isArray(viewingImage?.list) ? viewingImage.list.filter(Boolean) : [],
      index: typeof viewingImage?.index === 'number' ? viewingImage.index : 0,
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
    setViewingImage({ src: list[getPrevIndex()], list, index: getPrevIndex() });
  }, [hasList, getPrevIndex, list, setViewingImage]);

  const goNext = useCallback(() => {
    if (!hasList) return;
    setViewingImage({ src: list[getNextIndex()], list, index: getNextIndex() });
  }, [hasList, getNextIndex, list, setViewingImage]);

  const close = useCallback(() => {
    setViewingImage(null);
  }, [setViewingImage]);

  // 键盘支持
  useEffect(() => {
    if (!viewingImage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key.toLowerCase()) {
        case 'a': e.preventDefault(); goPrev(); break;
        case 'd': e.preventDefault(); goNext(); break;
        case 'q':
        case 'escape': e.preventDefault(); close(); break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [viewingImage, goPrev, goNext, close]);

  // Touch & Gesture State
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const touchStartTime = useRef<number>(0);
  const lastValidTapEndTime = useRef<number>(0);

  const [isPinching, setIsPinching] = useState(false);

  // Carousel State
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Vertical Dismiss State
  const [dragY, setDragY] = useState(0);
  const [isDraggingVertical, setIsDraggingVertical] = useState(false);

  // Zoom State
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [startPinchDist, setStartPinchDist] = useState<number | null>(null);
  const [startPinchCenter, setStartPinchCenter] = useState<{ x: number, y: number } | null>(null);
  const [startScale, setStartScale] = useState(1);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  const MAX_SCALE = 3;

  // Hint State
  const [showHint, setShowHint] = useState(false);

  // Persistent Hints: 只有切图时(viewingImage 变化)且是移动端，才重置显示
  useEffect(() => {
    if (isMobile && viewingImage) {
      setShowHint(true);
    }
  }, [isMobile, viewingImage]);


  // 重置状态
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

  const minFlickVelocity = 0.5; // px/ms

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
    // 只要有交互，就隐藏提示 (Persistent until interaction)
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
        // FIX: 不急着设置为 Swiping，等待 Move 判断方向
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
      // Pinch Zoom Logic (Omitted for brevity - same as before)
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
        // 判定方向锁定
        if (!isDraggingVertical && !isSwiping) {
          if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
            setIsDraggingVertical(true); // 锁定为垂直
          } else if (Math.abs(deltaX) > 10) {
            setIsSwiping(true); // 锁定为水平
          }
        }

        if (isDraggingVertical) {
          setDragY(deltaY);
          e.preventDefault();
        } else if (isSwiping) {
          // 水平滑动 -> Carousel
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

    // 0. 处理缩放回弹
    if (scale > MAX_SCALE) setScale(MAX_SCALE);
    else if (scale < 1) {
      setScale(1);
      setPan({ x: 0, y: 0 });
    }

    const isMoved = Math.abs(swipeOffset) > 10 || Math.abs(dragY) > 10 || isDraggingVertical || isSwiping;
    if (!isMoved && touchStart && touchDuration < 300) {
      lastValidTapEndTime.current = now;
    }

    // 1. 处理垂直关闭
    if (isDraggingVertical) {
      if (Math.abs(dragY) > 100) {
        close();
      } else {
        setDragY(0);
      }
      setIsDraggingVertical(false);
      return;
    }

    // 2. 处理 Carousel Swipe
    let finalSwipeOffset = swipeOffset;

    // 只有当真正触发了 Swipe (Start + Move锁定了Swipe) 或者是还没锁定但瞬时 flick 才处理
    // 如果 touchStart 但没有 move (点击)，不处理 flick
    if (scale <= 1 && touchStart) {
      // Flick Detection
      const distanceX = e.changedTouches[0].clientX - touchStart.x;
      const velocity = Math.abs(distanceX) / touchDuration;

      // 如果已经锁定了 Swiping 且速度够快
      // 或者还没锁定(距离短)但速度极快 (Flick)
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

  return (
    <div
      className="fixed inset-0 z-[2000] flex flex-col items-center justify-center cursor-zoom-out touch-none overflow-hidden transition-colors"
      style={{ backgroundColor: `rgba(0, 0, 0, ${bgOpacity * 0.95})` }}
      onClick={close}
    >

      {/* Carousel Container */}
      <div
        className="absolute inset-0 flex items-center justify-center transition-transform ease-out will-change-transform"
        style={{
          transform: `translateX(${swipeOffset}px) translateY(${dragY}px) scale(${1 - Math.abs(dragY) / 1000})`,
          transitionDuration: isSwiping || isResetting || isDraggingVertical ? '0ms' : '300ms'
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* 上一张 */}
        {prevSrc && (
          <div className="absolute left-0 top-0 w-full h-full -translate-x-full flex items-center justify-center p-4">
            <img src={prevSrc} className="max-h-[80vh] max-w-full object-contain pointer-events-none" />
          </div>
        )}

        {/* 当前张 */}
        <div className="relative w-full h-full flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
          <img
            src={src}
            className="max-h-[80vh] max-w-full object-contain will-change-transform"
            style={{
              transform: `scale(${scale}) translate(${pan.x / scale}px, ${pan.y / scale}px)`,
              transition: isSwiping || isDraggingVertical || isResetting || isPinching ? 'none' : 'transform 300ms cubic-bezier(0.25, 0.8, 0.25, 1)'
            }}
          />
        </div>

        {/* 下一张 */}
        {nextSrc && (
          <div className="absolute left-0 top-0 w-full h-full translate-x-full flex items-center justify-center p-4">
            <img src={nextSrc} className="max-h-[80vh] max-w-full object-contain pointer-events-none" />
          </div>
        )}
      </div>

      {/* 缩略图烂 & 按钮 */}
      <div
        className={`shrink-0 flex items-center justify-center gap-6 z-20 transition-opacity duration-200 ${isDraggingVertical ? 'opacity-0' : 'opacity-100'} ${isMobile
          ? 'fixed bottom-0 w-full px-2 pb-6 pt-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent'
          : 'fixed bottom-8'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {!isMobile && (
          <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
            <div className="w-8 h-8 rounded-md bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-xs shadow-lg backdrop-blur-sm">A</div>
            <span className="text-white/70 text-sm">上一张</span>
          </div>
        )}

        {hasList && (
          <div className={`flex items-center gap-3 px-4 py-2 rounded-full border border-white/15 ${isMobile
            ? 'overflow-x-auto w-fit mx-auto max-w-full scrollbar-hide bg-transparent border-none'
            : 'bg-black/70 backdrop-blur-md'
            }`}>
            {!isMobile && (
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
                  onClick={(e) => { e.stopPropagation(); setViewingImage({ src: thumbSrc, list, index: idx }); }}
                >
                  <img src={thumbSrc} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {!isMobile && (
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

        {!isMobile && (
          <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
            <div className="w-8 h-8 rounded-md bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-xs shadow-lg backdrop-blur-sm">D</div>
            <span className="text-white/70 text-sm">下一张</span>
          </div>
        )}
      </div>

      <button
        className={`absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-black/60 hover:bg-[#ff4655] rounded-full text-white transition-all backdrop-blur-md border border-white/20 z-50 ${isDraggingVertical ? 'opacity-0' : 'opacity-100'}`}
        onClick={(e) => { e.stopPropagation(); close(); }}
        title="关闭 (Q)"
      >
        <Icon name="X" size={28} />
      </button>

      {/* 底部操作提示 (仅移动端) */}
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
