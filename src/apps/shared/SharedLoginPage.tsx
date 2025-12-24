import React, { useState, useEffect } from 'react';
import Icon from '../../components/Icon';
import { useEmailAuth } from '../../hooks/useEmailAuth';
import { validateEmail } from '../../lib/emailValidator';

interface SharedLoginPageProps {
    setAlertMessage: (msg: string | null) => void;
    onBack?: () => void;
}

type AuthMode = 'login' | 'register' | 'forgot' | 'magic-link' | 'register-sent' | 'reset-sent' | 'magic-sent';

/**
 * 共享库登录页面
 * 支持邮箱密码登录、注册、忘记密码
 */
function SharedLoginPage({ setAlertMessage, onBack }: SharedLoginPageProps) {
    const { signInWithPassword, signUpWithEmail, resetPassword, signInWithEmail, verifyOtp } = useEmailAuth();
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [currentPoster, setCurrentPoster] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
            title: '分享你的',
            highlight: '战术',
            desc: '与全球特工分享你的技能点位，探索社区精选的战术库',
        },
        {
            title: '探索',
            highlight: '无限可能',
            desc: '海量点位教学，助你掌握每一张地图的关键点位',
        },
        {
            title: '创造',
            highlight: '致胜时刻',
            desc: '记录并在社区分享你的独家理解，成为真正的战术大师',
        },
    ];

    const currentSlogan = sloganList[currentPoster % sloganList.length];

    // 轮播定时器
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentPoster((prev) => (prev + 1) % posters.length);
        }, 8000); // 8秒切换

        return () => clearInterval(timer);
    }, []);

    const resetForm = () => {
        setPassword('');
        setConfirmPassword('');
        setOtpCode('');
        setValidationError(null);
    };

    const handleModeChange = (newMode: AuthMode) => {
        setMode(newMode);
        resetForm();
    };

    // 登录处理
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);

        const validation = validateEmail(email);
        if (!validation.isValid) {
            setValidationError(validation.error || '邮箱格式不正确');
            return;
        }

        if (!password) {
            setValidationError('请输入密码');
            return;
        }

        setIsSubmitting(true);
        const result = await signInWithPassword(email, password);
        setIsSubmitting(false);

        if (!result.success) {
            setValidationError(result.error || '登录失败');
        }
    };

    // 注册处理
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);

        const validation = validateEmail(email);
        if (!validation.isValid) {
            setValidationError(validation.error || '邮箱格式不正确');
            return;
        }

        if (password.length < 6) {
            setValidationError('密码至少需要6位');
            return;
        }

        if (password !== confirmPassword) {
            setValidationError('两次输入的密码不一致');
            return;
        }

        setIsSubmitting(true);
        try {
            // 生成随机 ID：8位 大写字母+数字
            const generateId = () => {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                let res = '';
                for (let i = 0; i < 8; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
                return res;
            };
            const customId = generateId();

            // 注册并附带元数据
            const result = await signUpWithEmail(email, password, {
                nickname: customId,
                custom_id: customId,
                avatar: '' // 默认空头像，需在个人信息里随机
            });

            if (result.success) {
                setMode('register-sent');
            } else {
                setValidationError(result.error || '注册失败');
            }
        } catch (err) {
            setValidationError('发生未知错误');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 忘记密码处理
    const handleForgot = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);

        const validation = validateEmail(email);
        if (!validation.isValid) {
            setValidationError(validation.error || '邮箱格式不正确');
            return;
        }

        setIsSubmitting(true);
        const result = await resetPassword(email);
        setIsSubmitting(false);

        if (result.success) {
            setMode('reset-sent');
        } else {
            setValidationError(result.error || '发送失败');
        }
    };

    // 验证码登录处理
    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);

        const validation = validateEmail(email);
        if (!validation.isValid) {
            setValidationError(validation.error || '邮箱格式不正确');
            return;
        }

        setIsSubmitting(true);
        const result = await signInWithEmail(email);
        setIsSubmitting(false);

        if (result.success) {
            setMode('magic-sent');
        } else {
            setValidationError(result.error || '发送失败');
        }
    };

    // 验证 OTP 验证码
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);

        if (otpCode.length !== 6) {
            setValidationError('请输入6位验证码');
            return;
        }

        setIsSubmitting(true);
        const result = await verifyOtp(email, otpCode);
        setIsSubmitting(false);

        if (!result.success) {
            setValidationError(result.error || '验证失败');
        }
        // 验证成功会自动登录，由 useEmailAuth 中的 onAuthStateChange 处理
    };

    // 渲染成功提示页面
    const renderSuccessPage = (title: string, message: string, buttonText: string) => (
        <div className="text-center py-4">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="Mail" size={32} className="text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
            <p className="text-gray-400 text-sm mb-4">
                请检查 <span className="text-white font-medium">{email}</span> 的收件箱
            </p>
            <p className="text-gray-500 text-xs">{message}</p>
            <button
                onClick={() => handleModeChange('login')}
                className="mt-6 text-sm text-[#ff4655] hover:text-[#ff6b77] transition-colors"
            >
                {buttonText}
            </button>
        </div>
    );

    // 渲染表单
    const renderForm = () => {
        if (mode === 'register-sent') {
            return renderSuccessPage(
                '注册邮件已发送！',
                '请点击邮件中的链接完成注册',
                '返回登录'
            );
        }

        if (mode === 'reset-sent') {
            return renderSuccessPage(
                '重置链接已发送！',
                '请点击邮件中的链接重置密码',
                '返回登录'
            );
        }

        if (mode === 'magic-sent') {
            // 显示验证码输入界面 - 现代化布局
            return (
                <div className="space-y-6">
                    {/* 顶部信息区 - 左右布局 */}
                    <div className="flex items-start gap-4">
                        {/* 左侧图标 */}
                        <div className="w-14 h-14 bg-gradient-to-br from-[#ff4655] to-[#ff4655]/60 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-[#ff4655]/20">
                            <Icon name="Mail" size={26} className="text-white" />
                        </div>
                        {/* 右侧文字 */}
                        <div className="flex-1 pt-1">
                            <h3 className="text-lg font-bold text-white leading-tight">验证码已发送</h3>
                            <p className="text-sm text-gray-400 mt-1">
                                已发送至 <span className="text-[#ff4655] font-medium">{email}</span>
                            </p>
                        </div>
                    </div>

                    {/* 分隔线 */}
                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    <form onSubmit={handleVerifyOtp} className="space-y-5">
                        {/* 验证码输入区域 - 6格子 */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-3">请输入6位验证码</label>
                            <div className="flex gap-2 w-[294px]">
                                {[0, 1, 2, 3, 4, 5].map((index) => (
                                    <input
                                        key={index}
                                        id={`otp-${index}`}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={otpCode[index] || ''}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= 1) {
                                                const newCode = otpCode.split('');
                                                newCode[index] = val;
                                                const result = newCode.join('').slice(0, 6);
                                                setOtpCode(result);
                                                setValidationError(null);
                                                // 自动跳到下一格
                                                if (val && index < 5) {
                                                    document.getElementById(`otp-${index + 1}`)?.focus();
                                                }
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            // 退格键跳到上一格
                                            if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
                                                document.getElementById(`otp-${index - 1}`)?.focus();
                                            }
                                        }}
                                        onPaste={(e) => {
                                            e.preventDefault();
                                            const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                                            setOtpCode(pasteData);
                                            // 聚焦到对应位置
                                            const focusIndex = Math.min(pasteData.length, 5);
                                            document.getElementById(`otp-${focusIndex}`)?.focus();
                                        }}
                                        className={`w-[42px] h-12 bg-[#0f1923] border rounded-lg text-white text-xl font-mono text-center focus:outline-none transition-all ${validationError
                                            ? 'border-red-500'
                                            : otpCode[index]
                                                ? 'border-[#ff4655]/50'
                                                : 'border-white/10 focus:border-[#ff4655]'
                                            }`}
                                        disabled={isSubmitting}
                                        autoFocus={index === 0}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* 错误提示 */}
                        {validationError && (
                            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
                                <Icon name="AlertCircle" size={16} />
                                <span>{validationError}</span>
                            </div>
                        )}

                        {/* 按钮组 - 左右布局 */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => handleModeChange('login')}
                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-medium rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2"
                            >
                                <Icon name="ArrowLeft" size={16} />
                                返回
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || otpCode.length !== 6}
                                className="flex-[2] py-3 bg-[#ff4655] hover:bg-[#ff5a67] text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#ff4655]/20"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        验证中
                                    </>
                                ) : (
                                    <>
                                        <Icon name="LogIn" size={18} />
                                        验证登录
                                    </>
                                )}
                            </button>
                        </div>

                        {/* 重新发送链接 */}
                        <div className="text-center pt-2">
                            <button
                                type="button"
                                onClick={() => handleMagicLink({ preventDefault: () => { } } as React.FormEvent)}
                                disabled={isSubmitting}
                                className="text-sm text-gray-500 hover:text-[#ff4655] transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                            >
                                <Icon name="RefreshCw" size={14} />
                                没收到？重新发送
                            </button>
                        </div>
                    </form>
                </div>
            );
        }

        const isLogin = mode === 'login';
        const isRegister = mode === 'register';
        const isForgot = mode === 'forgot';
        const isMagicLink = mode === 'magic-link';

        const getSubmitHandler = () => {
            if (isLogin) return handleLogin;
            if (isRegister) return handleRegister;
            if (isMagicLink) return handleMagicLink;
            return handleForgot;
        };

        return (
            <form onSubmit={getSubmitHandler()}>
                {/* 邮箱输入 */}
                <div className="mb-4">
                    <label className="block text-sm text-gray-400 mb-2">邮箱地址</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setValidationError(null); }}
                        placeholder="your@email.com"
                        className={`w-full px-4 py-3 bg-[#0f1923] border rounded-lg text-white text-base placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors ${validationError ? 'border-red-500 focus:ring-red-500/50' : 'border-white/[0.08] focus:ring-[#ff4655]/50 focus:border-[#ff4655]'
                            }`}
                        disabled={isSubmitting}
                        autoFocus
                    />
                </div>

                {/* 密码输入（登录和注册模式） */}
                {(isLogin || isRegister) && (
                    <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-2">密码</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setValidationError(null); }}
                                placeholder={isRegister ? '至少6位' : '输入密码'}
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
                )}

                {/* 确认密码（仅注册模式） */}
                {isRegister && (
                    <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-2">确认密码</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => { setConfirmPassword(e.target.value); setValidationError(null); }}
                                placeholder="再次输入密码"
                                className="w-full px-4 py-3 pr-12 bg-[#0f1923] border border-white/[0.08] rounded-lg text-white text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff4655]/50 focus:border-[#ff4655] transition-colors"
                                disabled={isSubmitting}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                            >
                                <Icon name={showConfirmPassword ? 'EyeOff' : 'Eye'} size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* 错误提示 */}
                {validationError && (
                    <p className="mb-4 text-sm text-red-400">{validationError}</p>
                )}

                {/* 提交按钮 */}
                <button
                    type="submit"
                    disabled={isSubmitting || !email.trim()}
                    className="w-full py-3 bg-[#ff4655] hover:bg-[#ff5a67] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            处理中...
                        </>
                    ) : (
                        <>
                            <Icon name={isLogin ? 'LogIn' : isRegister ? 'UserPlus' : 'Mail'} size={18} />
                            {isLogin ? '登录' : isRegister ? '注册' : isMagicLink ? '发送登录链接' : '发送重置链接'}
                        </>
                    )}
                </button>

                {/* 模式切换链接 */}
                <div className="mt-4 text-center space-y-2">
                    {isRegister && (
                        <button
                            type="button"
                            onClick={() => handleModeChange('login')}
                            className="block w-full text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            已有账号？<span className="text-[#ff4655]">登录</span>
                        </button>
                    )}
                    {isForgot && (
                        <button
                            type="button"
                            onClick={() => handleModeChange('login')}
                            className="block w-full text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            ← 返回登录
                        </button>
                    )}
                    {isMagicLink && (
                        <button
                            type="button"
                            onClick={() => handleModeChange('login')}
                            className="block w-full text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            ← 返回密码登录
                        </button>
                    )}
                </div>
            </form>
        );
    };

    const titles: Record<AuthMode, string> = {
        login: '共享库登录',
        register: '注册账号',
        forgot: '忘记密码',
        'magic-link': '邮箱验证码登录',
        'register-sent': '注册确认',
        'reset-sent': '重置密码',
        'magic-sent': '登录链接已发送',
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
                /* 已输入内容但失焦的输入框边框降低亮度 */
                input:not(:focus):not(:placeholder-shown) {
                    border-color: rgba(255, 255, 255, 0.15) !important;
                }
                /* 隐藏 Edge/Chrome 浏览器默认的密码显示/隐藏图标 */
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
                    {/* 大菱形 */}
                    <div
                        className="absolute top-1/4 left-1/3 w-96 h-96 border border-[#ff4655]/30"
                        style={{ transform: 'rotate(45deg)' }}
                    />
                    <div
                        className="absolute top-1/3 left-1/4 w-64 h-64 border border-[#ff4655]/20"
                        style={{ transform: 'rotate(45deg)' }}
                    />
                    {/* 网格线 */}
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

                {/* 顶部渐变遮罩 - 用于 Logo */}
                <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#0f1923] to-transparent" />

                {/* 底部渐变遮罩 - 用于标语 */}
                <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#0f1923] to-transparent" />

                {/* 右侧渐变遮罩 */}

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
                        {/* Tab 切换 - 仅在登录/注册模式显示 */}
                        {(mode === 'login' || mode === 'register') && (
                            <div className="flex gap-6 mb-8">
                                <button
                                    onClick={() => handleModeChange('login')}
                                    className={`text-lg font-semibold pb-2 border-b-2 transition-colors ${mode === 'login'
                                        ? 'text-white border-[#ff4655]'
                                        : 'text-gray-500 border-transparent hover:text-gray-300'
                                        }`}
                                >
                                    登录
                                </button>
                                <button
                                    onClick={() => handleModeChange('register')}
                                    className={`text-lg font-semibold pb-2 border-b-2 transition-colors ${mode === 'register'
                                        ? 'text-white border-[#ff4655]'
                                        : 'text-gray-500 border-transparent hover:text-gray-300'
                                        }`}
                                >
                                    注册
                                </button>
                            </div>
                        )}

                        {/* 其他模式标题 */}
                        {mode !== 'login' && mode !== 'register' && (
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-white">{titles[mode]}</h2>
                                <p className="text-gray-500 text-sm mt-1">
                                    {mode === 'forgot' && '输入邮箱重置密码'}
                                    {mode === 'magic-link' && '输入邮箱获取验证码'}
                                    {mode === 'register-sent' && '请查收邮件完成注册'}
                                    {mode === 'reset-sent' && '请查收邮件重置密码'}
                                    {mode === 'magic-sent' && '请输入收到的验证码'}
                                </p>
                            </div>
                        )}

                        {/* 表单 */}
                        {renderForm()}

                        {/* 底部链接 - 仅登录模式 */}
                        {mode === 'login' && (
                            <div className="flex justify-between items-center mt-6 text-sm">
                                <button
                                    onClick={() => handleModeChange('forgot')}
                                    className="text-gray-500 hover:text-[#ff4655] transition-colors"
                                >
                                    忘记密码？
                                </button>
                                <button
                                    onClick={() => handleModeChange('magic-link')}
                                    className="text-gray-500 hover:text-[#ff4655] transition-colors"
                                >
                                    验证码登录
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 返回按钮 */}
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="mt-6 w-full py-3 text-sm text-gray-400 hover:text-[#ff4655] transition-colors flex items-center justify-center gap-2 group"
                        >
                            <Icon name="ArrowLeft" size={16} className="group-hover:-translate-x-1 transition-transform" />
                            返回继续浏览
                        </button>
                    )}
                </div>

                {/* 底部版权 - 双击可进入验证码调试模式 */}
                <div
                    className="absolute bottom-6 left-0 right-0 text-center"
                    onDoubleClick={() => {
                        setEmail('debug@example.com');
                        setMode('magic-sent');
                    }}
                >
                    <p className="text-gray-600 text-xs">
                        © 2024 VALPOINT · 社区驱动的战术平台
                    </p>
                </div>
            </div>
        </div>
    );
}

export default SharedLoginPage;

