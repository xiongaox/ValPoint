/**
 * LibrarySwitchButton - 组件层
 *
 * 模块定位：
 * - 所在层级：组件层
 * - 主要目标：承载界面渲染与事件分发
 *
 * 关键职责：
 * - 聚焦界面渲染与交互事件回调
 * - 接收上层 props 并输出稳定 UI 行为
 * - 避免在组件中堆积跨模块业务逻辑
 *
 * 主要导出：
 * - `default:LibrarySwitchButton`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`../lib/systemSettings`
 * - 下游影响：供页面与应用壳组合
 */

import React, { useState, useEffect } from 'react';
import { getSystemSettings } from '../lib/systemSettings';

interface LibrarySwitchButtonProps {
    currentLibrary: 'personal' | 'shared';
    hideSharedButton?: boolean;
    onSharedClick?: () => void;
}
const LibrarySwitchButton: React.FC<LibrarySwitchButtonProps> = ({ currentLibrary, hideSharedButton = false, onSharedClick }) => {
    const [personalUrl, setPersonalUrl] = useState<string>('');
    const [sharedUrl, setSharedUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadSettings() {
            setIsLoading(true);

            const envSharedUrl = (window as any).__ENV__?.VITE_SHARED_LIBRARY_URL
                || import.meta.env.VITE_SHARED_LIBRARY_URL
                || '';

            const envPersonalUrl = (window as any).__ENV__?.VITE_PERSONAL_LIBRARY_URL
                || import.meta.env.VITE_PERSONAL_LIBRARY_URL
                || '';

            const settings = await getSystemSettings();
            if (settings) {
                setPersonalUrl(envPersonalUrl || '/user.html');
                setSharedUrl(envSharedUrl || '/');
            } else {
                setPersonalUrl(envPersonalUrl || '/user.html');
                setSharedUrl(envSharedUrl || '/');
            }
            setIsLoading(false);
        }
        loadSettings();
    }, []);

    const isPersonalActive = currentLibrary === 'personal';

    const containerStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center', // 说明：确保居中。
        gap: 0, // 说明：间距为 0。
        padding: '8px',
        width: '166px',
        height: '54px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxSizing: 'border-box', // 说明：尺寸包含内边距。
    };

    const buttonBaseStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '74px',
        height: '36px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 700,
        textDecoration: 'none',
        lineHeight: '1', // 说明：行高与字体一致。
        textAlign: 'center', // 说明：文字水平居中。
        padding: '0', // 说明：移除额外内边距。
        transition: 'all 0.2s ease',
    };

    if (isLoading) {
        return (
            <div style={containerStyle}>
                <div style={{ ...buttonBaseStyle, color: '#6b7280' }}>加载中...</div>
            </div>
        );
    }

    if (hideSharedButton && currentLibrary === 'personal') {
        return null;
    }

    return (
        <div style={containerStyle}>
            {isPersonalActive ? (
                <div
                    style={{
                        ...buttonBaseStyle,
                        backgroundColor: '#ff4655',
                        color: '#ffffff',
                        cursor: 'default',
                    }}
                >
                    个人库
                </div>
            ) : (
                <a
                    href={personalUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        ...buttonBaseStyle,
                        backgroundColor: 'transparent',
                        color: personalUrl ? 'rgba(255, 255, 255, 0.7)' : 'rgba(107, 114, 128, 0.5)',
                        cursor: personalUrl ? 'pointer' : 'not-allowed',
                    }}
                    title={personalUrl ? '跳转到个人库' : '请在后台配置个人库域名'}
                    onClick={e => { if (!personalUrl) e.preventDefault(); }}
                    onMouseEnter={e => {
                        if (personalUrl) {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.color = '#ffffff';
                        }
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = personalUrl ? 'rgba(255, 255, 255, 0.7)' : 'rgba(107, 114, 128, 0.5)';
                    }}
                >
                    个人库
                </a>
            )}

            {!isPersonalActive ? (
                <div
                    onClick={onSharedClick}
                    style={{
                        ...buttonBaseStyle,
                        backgroundColor: '#17b890',
                        color: '#ffffff',
                        cursor: onSharedClick ? 'pointer' : 'default',
                    }}
                    title={onSharedClick ? '点击切换订阅源' : undefined}
                >
                    共享库
                </div>
            ) : (
                <a
                    href={sharedUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        ...buttonBaseStyle,
                        backgroundColor: 'transparent',
                        color: sharedUrl ? 'rgba(255, 255, 255, 0.7)' : 'rgba(107, 114, 128, 0.5)',
                        cursor: sharedUrl ? 'pointer' : 'not-allowed',
                    }}
                    title={sharedUrl ? '跳转到共享库' : '请在后台配置共享库域名'}
                    onClick={e => { if (!sharedUrl) e.preventDefault(); }}
                    onMouseEnter={e => {
                        if (sharedUrl) {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.color = '#ffffff';
                        }
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = sharedUrl ? 'rgba(255, 255, 255, 0.7)' : 'rgba(107, 114, 128, 0.5)';
                    }}
                >
                    共享库
                </a>
            )}
        </div>
    );
};

export default LibrarySwitchButton;
