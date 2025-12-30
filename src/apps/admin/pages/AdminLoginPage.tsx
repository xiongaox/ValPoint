/**
 * AdminLoginPage - 后台管理登录页面
 * 
 * 职责：
 * - 仅支持账号密码登录（不支持注册、忘记密码、验证码）
 * - 账号密码完全依赖环境变量配置
 * - 保留与共享库登录页相同的海报轮播布局
 */
import React, { useState, useEffect } from 'react';
import Icon from '../../../components/Icon';
import { AdminInfo } from '../AdminApp';

interface AdminLoginPageProps {
    onLogin: (info: AdminInfo) => void;
    setAlertMessage: (msg: string | null) => void;
}

/**
 * 后台管理登录页面
 * 简化版：仅账号+密码，无注册/忘记密码
 */
function AdminLoginPage({ onLogin, setAlertMessage }: AdminLoginPageProps) {
    const [account, setAccount] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [currentPoster, setCurrentPoster] = useState(0);

    // 海报列表
    const posters = [
        '/poster/海报1.webp',
        '/poster/海报2.webp',
        '/poster/海报3.webp',
        '/poster/海报4.webp',
        '/poster/海报5.webp',
        '/poster/海报6.webp',
    ];

    // 标语列表（与海报轮播同步）
    const sloganList = [
        {
            title: '掌控',
            highlight: '全局',
            desc: '后台管理系统，高效管理你的点位库',
        },
        {
            title: '数据',
            highlight: '洞察',
            desc: '用户数据、下载日志、投稿审核一目了然',
        },
        {
            title: '系统',
            highlight: '配置',
            desc: '灵活的系统设置，打造专属的点位平台',
        },
    ];

    const currentSlogan = sloganList[currentPoster % sloganList.length];

    // 轮播定时器
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentPoster((prev) => (prev + 1) % posters.length);
        }, 8000);

        return () => clearInterval(timer);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!account.trim()) {
            setError('请输入账号');
            return;
        }

        if (!password) {
            setError('请输入密码');
            return;
        }

        setIsSubmitting(true);

        try {
            // 方式1: 环境变量账号（超级管理员后门）
            const adminAccount = (window as any).__ENV__?.VITE_ADMIN_ACCOUNT
                || import.meta.env.VITE_ADMIN_ACCOUNT;
            const adminPassword = (window as any).__ENV__?.VITE_ADMIN_PASSWORD
                || import.meta.env.VITE_ADMIN_PASSWORD;

            console.log('[Admin Login] 输入账号:', account.trim());
            console.log('[Admin Login] 环境变量账号:', adminAccount);
            console.log('[Admin Login] 环境变量匹配:', account.trim().toLowerCase() === adminAccount?.trim()?.toLowerCase());

            if (adminAccount && adminPassword
                && account.trim().toLowerCase() === adminAccount.trim().toLowerCase()
                && password === adminPassword) {
                console.log('[Admin Login] ✓ 环境变量账号匹配成功');
                setAlertMessage('环境变量管理员登录成功');
                onLogin({
                    account: adminAccount,
                    isSuperAdmin: true,
                    role: 'super_admin',
                });
                setIsSubmitting(false);
                return;
            }

            console.log('[Admin Login] 环境变量不匹配，尝试 Supabase Auth...');

            // 方式2: Supabase Auth 登录
            const { adminSupabase } = await import('../../../supabaseClient');

            console.log('[Admin Login] 调用 signInWithPassword...');
            const { data: authData, error: authError } = await adminSupabase.auth.signInWithPassword({
                email: account.trim(),
                password: password,
            });

            console.log('[Admin Login] Auth 结果:', { authData: authData?.user?.id, authError });

            if (authError) {
                console.log('[Admin Login] ✗ Auth 失败:', authError.message);
                setError('账号或密码错误');
                setIsSubmitting(false);
                return;
            }

            console.log('[Admin Login] ✓ Auth 成功，用户ID:', authData.user.id);

            // 检查用户角色和获取完整 profile
            console.log('[Admin Login] 查询 user_profiles...');
            const { data: profile, error: profileError } = await adminSupabase
                .from('user_profiles')
                .select('role, nickname, avatar')
                .eq('id', authData.user.id)
                .single();

            console.log('[Admin Login] Profile 结果:', { profile, profileError });

            if (profileError || !profile) {
                console.log('[Admin Login] ✗ 获取用户信息失败:', profileError);
                setError('获取用户信息失败');
                await adminSupabase.auth.signOut();
                setIsSubmitting(false);
                return;
            }

            console.log('[Admin Login] 用户角色:', profile.role);

            if (profile.role !== 'admin' && profile.role !== 'super_admin') {
                console.log('[Admin Login] ✗ 权限不足');
                setError('您没有管理员权限');
                await adminSupabase.auth.signOut();
                setIsSubmitting(false);
                return;
            }

            console.log('[Admin Login] ✓ 登录成功!');
            setAlertMessage('登录成功');
            onLogin({
                account: account.trim(),
                isSuperAdmin: profile.role === 'super_admin',
                userId: authData.user.id,
                nickname: profile.nickname || undefined,
                avatar: profile.avatar || undefined,
                role: profile.role,
            });
        } catch (err) {
            console.error('[Admin Login] ✗ 异常:', err);
            setError('登录失败，请稍后重试');
        }

        setIsSubmitting(false);
    };

    return (
        <div className="flex h-screen w-screen bg-[#0f1923] overflow-hidden">
            {/* 覆盖浏览器默认的 autofill 样式 */}
            <style>{`
                input:-webkit-autofill,
                input:-webkit-autofill:hover,
                input:-webkit-autofill:focus,
                input:-webkit-autofill:active {
                    -webkit-box-shadow: 0 0 0 30px #0f1923 inset !important;
                    -webkit-text-fill-color: white !important;
                    caret-color: white !important;
                    border-color: rgba(255, 255, 255, 0.15) !important;
                }
                input:not(:focus):not(:placeholder-shown) {
                    border-color: rgba(255, 255, 255, 0.15) !important;
                }
                input::-ms-reveal,
                input::-ms-clear {
                    display: none;
                }
            `}</style>

            {/* 左侧 - 海报区域 */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
                {/* 海报轮播 */}
                {posters.map((poster, index) => (
                    <div
                        key={poster}
                        className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
                        style={{
                            backgroundImage: `url(${poster})`,
                            opacity: currentPoster === index ? 1 : 0,
                        }}
                    />
                ))}

                {/* 几何装饰图案 */}
                <div className="absolute inset-0 opacity-20">
                    <div
                        className="absolute top-1/4 left-1/3 w-96 h-96 border border-[#ff4655]/30"
                        style={{ transform: 'rotate(45deg)' }}
                    />
                    <div
                        className="absolute top-1/3 left-1/4 w-64 h-64 border border-[#ff4655]/20"
                        style={{ transform: 'rotate(45deg)' }}
                    />
                    <div className="absolute inset-0" style={{
                        backgroundImage: `
                            linear-gradient(to right, rgba(255,70,85,0.05) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255,70,85,0.05) 1px, transparent 1px)
                        `,
                        backgroundSize: '60px 60px'
                    }} />
                </div>

                {/* 发光圆环 */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-[500px] h-[500px] rounded-full border border-[#ff4655]/10 animate-pulse" />
                    <div className="absolute inset-8 rounded-full border border-[#ff4655]/20" />
                    <div className="absolute inset-16 rounded-full border border-[#ff4655]/10" />
                </div>

                {/* 红色光晕 */}
                <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-[#ff4655]/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-[#ff4655]/5 rounded-full blur-2xl" />

                {/* 顶部渐变遮罩 */}
                <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#0f1923] to-transparent" />

                {/* 底部渐变遮罩 */}
                <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#0f1923] to-transparent" />

                {/* 右侧渐变遮罩 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0f1923]" />

                {/* 斜切装饰线 */}
                <div className="absolute right-0 top-0 bottom-0 w-32">
                    <div className="absolute inset-0 bg-gradient-to-l from-[#0f1923] to-transparent" />
                    <div
                        className="absolute right-8 top-0 bottom-0 w-1 bg-[#ff4655]/50"
                        style={{ transform: 'skewX(-15deg)' }}
                    />
                    <div
                        className="absolute right-16 top-0 bottom-0 w-0.5 bg-[#ff4655]/30"
                        style={{ transform: 'skewX(-15deg)' }}
                    />
                </div>

                {/* 左上角 Logo */}
                <div className="absolute top-8 left-8 z-20">
                    <img src="/brand-logo.svg" alt="VALPOINT" className="h-14" />
                </div>

                {/* 左下角品牌标语 */}
                <div className="absolute bottom-12 left-12 z-20 max-w-xl transition-all duration-500 ease-in-out">
                    <h2 className="text-6xl font-black text-white uppercase tracking-wide mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700" key={`title-${currentPoster}`}>
                        {currentSlogan.title}<span className="text-[#ff4655]">{currentSlogan.highlight}</span>
                    </h2>
                    <p className="text-gray-400 text-xl font-medium animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100" key={`desc-${currentPoster}`}>
                        {currentSlogan.desc}
                    </p>
                </div>
            </div>

            {/* 右侧 - 登录区域 */}
            <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col items-center justify-center p-6 lg:p-12 relative">
                {/* 登录卡片 - 固定宽度 360px */}
                <div className="w-[360px] max-w-full">
                    {/* 卡片容器 */}
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
                        {/* 标题 */}
                        <h2 className="text-xl font-semibold text-white mb-6">登录后台</h2>

                        <form onSubmit={handleLogin}>
                            {/* 账号输入 */}
                            <div className="mb-4">
                                <label className="block text-sm text-gray-400 mb-2">账号</label>
                                <input
                                    type="text"
                                    value={account}
                                    onChange={(e) => { setAccount(e.target.value); setError(null); }}
                                    placeholder="请输入管理员账号"
                                    className={`w-full px-4 py-3 bg-[#0f1923] border rounded-lg text-white text-base placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors ${error ? 'border-red-500 focus:ring-red-500/50' : 'border-white/[0.08] focus:ring-[#ff4655]/50 focus:border-[#ff4655]'
                                        }`}
                                    disabled={isSubmitting}
                                    autoFocus
                                />
                            </div>

                            {/* 密码输入 */}
                            <div className="mb-4">
                                <label className="block text-sm text-gray-400 mb-2">密码</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setError(null); }}
                                        placeholder="请输入密码"
                                        className="w-full px-4 py-3 pr-12 bg-[#0f1923] border border-white/[0.08] rounded-lg text-white text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff4655]/50 focus:border-[#ff4655] transition-colors"
                                        disabled={isSubmitting}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                    >
                                        <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* 错误提示 */}
                            {error && (
                                <p className="mb-4 text-sm text-red-400">{error}</p>
                            )}

                            {/* 提交按钮 */}
                            <button
                                type="submit"
                                disabled={isSubmitting || !account.trim()}
                                className="w-full py-3 bg-[#ff4655] hover:bg-[#ff5a67] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        登录中...
                                    </>
                                ) : (
                                    <>
                                        <Icon name="LogIn" size={18} />
                                        登录后台
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* 底部版权 */}
                <div className="absolute bottom-6 left-0 right-0 text-center">
                    <p className="text-gray-600 text-xs">
                        © 2024 VALPOINT · 后台管理系统
                    </p>
                </div>
            </div>
        </div>
    );
}

export default AdminLoginPage;
