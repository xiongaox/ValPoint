/**
 * ICPFooter - ICP 备案信息
 *
 * 职责：
 * - 从环境变量读取备案信息并渲染
 * - 如无配置则不渲染，避免影响开源用户
 */

import React from 'react';

const GonganIcon = () => (
    <img src="/国徽.png" alt="公安" className="w-3.5 h-3.5 flex-shrink-0" />
);

const ICPFooter: React.FC = () => {
    // 支持运行时注入和构建时环境变量
    const icpNumber = (window as any).__ENV__?.VITE_ICP_NUMBER || import.meta.env.VITE_ICP_NUMBER;
    const psbNumber = (window as any).__ENV__?.VITE_PSB_NUMBER || import.meta.env.VITE_PSB_NUMBER;
    const copyrightText = (window as any).__ENV__?.VITE_COPYRIGHT_TEXT || import.meta.env.VITE_COPYRIGHT_TEXT;
    const deployPlatform = (window as any).__ENV__?.VITE_DEPLOY_PLATFORM || import.meta.env.VITE_DEPLOY_PLATFORM;

    // 如果都没有配置，则不显示 Footer
    if (!icpNumber && !psbNumber && !copyrightText && !deployPlatform) return null;

    return (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center gap-3 text-xs text-gray-400 w-full px-4">
            {copyrightText && (
                <div className="font-medium opacity-80 whitespace-nowrap">
                    {copyrightText}
                </div>
            )}

            {copyrightText && (icpNumber || psbNumber || deployPlatform) && <span className="text-gray-600 hidden sm:inline">|</span>}

            {(icpNumber || psbNumber) && (
                <div className="flex flex-wrap items-center justify-center gap-3">
                    {icpNumber && (
                        <a
                            href="https://beian.miit.gov.cn/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-white transition-colors whitespace-nowrap"
                        >
                            {icpNumber}
                        </a>
                    )}
                    {icpNumber && psbNumber && <span className="text-gray-600">|</span>}
                    {psbNumber && (
                        <a
                            href="https://www.beian.gov.cn/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-white transition-colors flex items-center gap-1 whitespace-nowrap"
                        >
                            <GonganIcon />
                            {psbNumber}
                        </a>
                    )}
                </div>
            )}

            {(icpNumber || psbNumber) && deployPlatform && <span className="text-gray-600 hidden sm:inline">|</span>}

            {deployPlatform && (
                <div className="whitespace-nowrap">
                    {deployPlatform}
                </div>
            )}
        </div>
    );
};

export default ICPFooter;
