/**
 * useIsMobile - 检测当前是否为移动端视口
 * 
 * 使用方法：
 *   const isMobile = useIsMobile();
 *   if (isMobile) { ... }
 * 
 * 默认断点：768px（可自定义）
 */
import { useState, useEffect } from 'react';

const DEFAULT_BREAKPOINT = 768;

export function useIsMobile(breakpoint: number = DEFAULT_BREAKPOINT): boolean {
    const [isMobile, setIsMobile] = useState(() => {
        // SSR 兼容：服务端返回 false
        if (typeof window === 'undefined') return false;
        return window.innerWidth < breakpoint;
    });

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };

        // 初始检查
        checkMobile();

        // 监听窗口大小变化
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [breakpoint]);

    return isMobile;
}

export default useIsMobile;
