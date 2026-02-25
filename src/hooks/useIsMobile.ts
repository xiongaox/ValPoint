/**
 * useIsMobile - Hook 层
 *
 * 模块定位：
 * - 所在层级：Hook 层
 * - 主要目标：封装状态、副作用与交互流程
 *
 * 关键职责：
 * - 封装状态管理与副作用控制
 * - 对外暴露清晰的交互动作与派生状态
 * - 隔离组件层与数据层耦合
 *
 * 主要导出：
 * - `useIsMobile`、`default:useIsMobile`
 *
 * 依赖关系：
 * - 上游依赖：`./useDeviceMode`
 * - 下游影响：供组件与控制器复用
 */

import { useDeviceMode } from './useDeviceMode';

const DEFAULT_BREAKPOINT = 768;

export function useIsMobile(breakpoint: number = DEFAULT_BREAKPOINT): boolean {
    const { isMobile } = useDeviceMode(breakpoint);
    return isMobile;
}

export default useIsMobile;
