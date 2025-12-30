/**
 * LibrarySwitchButton - 个人库/共享库切换按钮
 * 
 * 采用 Tab 选项卡样式：
 * - 两个按钮并排显示，当前库高亮，另一个库可点击跳转
 * - 尺寸规格：Tab 容器 166x54px，单个按钮 74x36px
 * - 支持根据设置完全隐藏共享库按钮
 */
import React, { useState, useEffect } from 'react';
import { getSystemSettings } from '../lib/systemSettings';

interface LibrarySwitchButtonProps {
    /** 当前库类型（用于高亮显示） */
    currentLibrary: 'personal' | 'shared';
    /** 是否隐藏共享库按钮 */
    hideSharedButton?: boolean;
    /** 当已经处于共享库时，点击共享库按钮的回调 */
    onSharedClick?: () => void;
}
const LibrarySwitchButton: React.FC<LibrarySwitchButtonProps> = ({ currentLibrary, hideSharedButton = false, onSharedClick }) => {
    const [personalUrl, setPersonalUrl] = useState<string>('');
    const [sharedUrl, setSharedUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadSettings() {
            setIsLoading(true);

            // 环境变量优先（支持本地和云服务器独立配置）
            const envSharedUrl = (window as any).__ENV__?.VITE_SHARED_LIBRARY_URL
                || import.meta.env.VITE_SHARED_LIBRARY_URL
                || '';

            const envPersonalUrl = (window as any).__ENV__?.VITE_PERSONAL_LIBRARY_URL
                || import.meta.env.VITE_PERSONAL_LIBRARY_URL
                || '';

            const settings = await getSystemSettings();
            if (settings) {
                // 环境变量 > 默认
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

    // 容器样式：164×52px（包含内边距），圆角 12px
    // 按钮 74×36px，间距 0，内边距 = 8px
    const containerStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center', // 确保居中
        gap: 0, // 间距为 0
        padding: '8px',
        width: '166px',
        height: '54px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxSizing: 'border-box', // 尺寸包含内边距
    };

    // 按钮样式：74×36px，圆角 8px
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
        lineHeight: '1', // 确保行高与字体一致
        textAlign: 'center', // 确保文字水平居中
        padding: '0', // 移除可能存在的内边距
        transition: 'all 0.2s ease',
    };

    // 加载中状态
    if (isLoading) {
        return (
            <div style={containerStyle}>
                <div style={{ ...buttonBaseStyle, color: '#6b7280' }}>加载中...</div>
            </div>
        );
    }

    // 如果隐藏共享库按钮且当前是个人库，则不显示切换按钮
    if (hideSharedButton && currentLibrary === 'personal') {
        return null;
    }

    return (
        <div style={containerStyle}>
            {/* 个人库按钮 */}
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

            {/* 共享库按钮 */}
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
