/**
 * AuthorLinksBar - 组件层
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
 * - `default:AuthorLinksBar`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`./Icon`、`../types/authorLinks`、`../lib/systemSettings`
 * - 下游影响：供页面与应用壳组合
 */

import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import { AuthorLinks, defaultAuthorLinks } from '../types/authorLinks';
import { getSystemSettings } from '../lib/systemSettings';
import { useEscapeClose } from '../hooks/useEscapeClose';

type QRModalType = 'donate' | 'contact' | null;

const getEnv = (key: string) => {
    return (window as any).__ENV__?.[key] || import.meta.env[key] || '';
};

type AuthorLinksBarProps = {
    compact?: boolean;
};

const AuthorLinksBar: React.FC<AuthorLinksBarProps> = ({ compact = false }) => {
    const [links, setLinks] = useState<AuthorLinks>(defaultAuthorLinks);
    const [qrModal, setQrModal] = useState<QRModalType>(null);
    const [donateTab, setDonateTab] = useState<'wechat' | 'alipay'>('wechat');

    // 固定的官方链接（不从数据库读取）
    const FIXED_GITHUB_URL = 'https://github.com/xiongaox/ValPoint';
    const FIXED_TUTORIAL_URL = '/wiki/';

    // 从环境变量读取二维码配置
    const donateWechatQr = getEnv('VITE_DONATE_WECHAT_QR');
    const donateAlipayQr = getEnv('VITE_DONATE_ALIPAY_QR');
    const contactWechatQr = getEnv('VITE_CONTACT_WECHAT_QR');

    useEffect(() => {
        const loadLinks = async () => {
            const settings = await getSystemSettings();
            if (settings?.author_links) {
                setLinks(settings.author_links);
            }
        };
        loadLinks();
    }, []);

    // 固定链接始终显示，可配置链接（打赏/联系）根据数据库配置显示
    const hasAnyLink = true; // 固定链接始终存在

    useEscapeClose(Boolean(qrModal), () => setQrModal(null));

    if (!hasAnyLink) return null;

    const buttonClass = compact
        ? "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border backdrop-blur-md whitespace-nowrap shrink-0"
        : "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all border backdrop-blur-md whitespace-nowrap shrink-0";
    const defaultStyle = "bg-black/40 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20";

    return (
        <>
            <div className={`flex items-center flex-nowrap ${compact ? 'gap-1.5' : 'gap-2'}`}>
                <a
                    href={FIXED_GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${buttonClass} bg-purple-500/20 border-purple-500/30 text-purple-400 hover:bg-purple-500/30 hover:border-purple-400/50`}
                >
                    <Icon name="Github" size={compact ? 13 : 14} />
                    项目地址
                </a>

                <a
                    href={FIXED_TUTORIAL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${buttonClass} bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30 hover:border-blue-400/50`}
                >
                    <Icon name="BookOpen" size={compact ? 13 : 14} />
                    使用教程
                </a>

                {(donateWechatQr || donateAlipayQr) && (
                    <button
                        onClick={() => setQrModal('donate')}
                        className={`${buttonClass} bg-amber-500/20 border-amber-500/30 text-amber-400 hover:bg-amber-500/30 hover:border-amber-400/50`}
                    >
                        <Icon name="Heart" size={compact ? 13 : 14} />
                        打赏作者
                    </button>
                )}

                {contactWechatQr && (
                    <button
                        onClick={() => setQrModal('contact')}
                        className={`${buttonClass} bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 hover:border-emerald-400/50`}
                    >
                        <Icon name="MessageCircle" size={compact ? 13 : 14} />
                        联系作者
                    </button>
                )}
            </div>

            {qrModal && (
                <div
                    className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                >
                    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#181b1f]/95 shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#1c2028]">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${qrModal === 'donate'
                                    ? 'bg-amber-500/15 border border-amber-500/35 text-amber-400'
                                    : 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-400'
                                    }`}>
                                    <Icon name={qrModal === 'donate' ? 'Heart' : 'MessageCircle'} size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-white">
                                    {qrModal === 'donate' ? '打赏作者' : '联系作者'}
                                </h3>
                            </div>
                            <button
                                onClick={() => setQrModal(null)}
                                className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors"
                            >
                                <Icon name="X" size={16} />
                            </button>
                        </div>

                        <div className="p-5 bg-[#181b1f]">
                            {qrModal === 'donate' ? (
                                <>
                                    {donateWechatQr && donateAlipayQr && (
                                        <div className="flex items-center bg-[#0f131a] p-1 rounded-lg border border-white/10 mb-4">
                                            <button
                                                onClick={() => setDonateTab('wechat')}
                                                className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold transition-all ${donateTab === 'wechat'
                                                    ? 'bg-emerald-500 text-white shadow-md'
                                                    : 'text-gray-400 hover:text-white'
                                                    }`}
                                            >
                                                <Icon name="MessageCircle" size={14} />
                                                微信
                                            </button>
                                            <button
                                                onClick={() => setDonateTab('alipay')}
                                                className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold transition-all ${donateTab === 'alipay'
                                                    ? 'bg-blue-500 text-white shadow-md'
                                                    : 'text-gray-400 hover:text-white'
                                                    }`}
                                            >
                                                <Icon name="Wallet" size={14} />
                                                支付宝
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex justify-center">
                                        <img
                                            src={donateTab === 'wechat' ? donateWechatQr : donateAlipayQr}
                                            alt={donateTab === 'wechat' ? '微信收款码' : '支付宝收款码'}
                                            className="max-w-[240px] rounded-lg border border-white/10"
                                        />
                                    </div>
                                    <p className="text-center text-gray-400 text-sm mt-4">
                                        感谢您的支持 ❤️
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="flex justify-center">
                                        <img
                                            src={contactWechatQr}
                                            alt="微信二维码"
                                            className="max-w-[240px] rounded-lg border border-white/10"
                                        />
                                    </div>
                                    <p className="text-center text-gray-400 text-sm mt-4">
                                        扫码添加作者微信
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AuthorLinksBar;
