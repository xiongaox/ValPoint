import React, { useState, useEffect, useMemo } from 'react';
import Icon from '../../../components/Icon';
import { getSystemSettings, updateSystemSettings } from '../../../lib/systemSettings';
import { ImageBedConfig, ImageBedProvider } from '../../../types/imageBed';
import { imageBedProviderDefinitions, imageBedProviderMap, defaultImageBedConfig } from '../../../lib/imageBed';

interface Settings {
    dailyDownloadLimit: number;
    enableEmailVerification: boolean;
    enableDownloadLogs: boolean;
    maintenanceMode: boolean;
}

interface LibraryUrls {
    sharedLibraryUrl: string;
}

// Tab 配置
type SettingsTab = 'imageBed' | 'submission' | 'download' | 'features' | 'domain';

const TABS: { id: SettingsTab; label: string; icon: 'Cloud' | 'Send' | 'Download' | 'ToggleLeft' | 'Globe' }[] = [
    { id: 'imageBed', label: '官方图床', icon: 'Cloud' },
    { id: 'submission', label: '投稿设置', icon: 'Send' },
    { id: 'download', label: '下载限制', icon: 'Download' },
    { id: 'features', label: '功能开关', icon: 'ToggleLeft' },
    { id: 'domain', label: '域名配置', icon: 'Globe' },
];

/**
 * 系统设置页面 - Tab 布局
 */
function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('imageBed');
    const [settings, setSettings] = useState<Settings>({
        dailyDownloadLimit: 5,
        enableEmailVerification: true,
        enableDownloadLogs: true,
        maintenanceMode: false,
    });
    const [libraryUrls, setLibraryUrls] = useState<LibraryUrls>({
        sharedLibraryUrl: '',
    });
    // 官方图床配置
    const [ossConfig, setOssConfig] = useState<ImageBedConfig>(defaultImageBedConfig);
    const [submissionEnabled, setSubmissionEnabled] = useState(false);
    const [dailySubmissionLimit, setDailySubmissionLimit] = useState(10);

    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // 当前图床定义
    const currentDefinition = useMemo(
        () => imageBedProviderMap[ossConfig.provider] || imageBedProviderDefinitions[0],
        [ossConfig.provider],
    );

    // 检查图床配置是否完整
    const isOssConfigValid = useMemo(() => {
        if (!ossConfig.provider) return false;
        const definition = imageBedProviderMap[ossConfig.provider];
        if (!definition) return false;
        // 检查必填字段
        return definition.fields
            .filter((f) => f.required)
            .every((f) => {
                const val = ossConfig[f.key];
                return val !== undefined && val !== '';
            });
    }, [ossConfig]);

    // 从 Supabase 加载设置
    useEffect(() => {
        async function loadSettings() {
            setIsLoading(true);
            const data = await getSystemSettings();
            if (data) {
                setLibraryUrls({
                    sharedLibraryUrl: data.shared_library_url || '',
                });
                if (data.official_oss_config) {
                    setOssConfig(data.official_oss_config);
                }
                setSubmissionEnabled(data.submission_enabled ?? false);
                setDailySubmissionLimit(data.daily_submission_limit ?? 10);
            }
            setIsLoading(false);
        }
        loadSettings();
    }, []);

    // 更新图床配置字段
    const updateOssField = (key: keyof ImageBedConfig, value: string | boolean) => {
        setOssConfig((prev) => {
            const next: ImageBedConfig = { ...prev, [key]: value };
            // 阿里云特殊处理
            if (prev.provider === 'aliyun') {
                if (key === 'area') next.region = typeof value === 'string' ? value : '';
                if (key === 'path') next.basePath = typeof value === 'string' ? value : '';
                if (key === 'customUrl') next.customDomain = typeof value === 'string' ? value : '';
            }
            return next;
        });
    };

    // 切换图床提供商
    const handleProviderSwitch = (provider: ImageBedProvider) => {
        if (provider === ossConfig.provider) return;
        const base = imageBedProviderMap[provider]?.defaultConfig || defaultImageBedConfig;
        setOssConfig({ ...base, provider, _configName: 'official' });
    };

    const handleSave = async () => {
        setIsSaving(true);
        const result = await updateSystemSettings({
            shared_library_url: libraryUrls.sharedLibraryUrl,
            official_oss_config: ossConfig,
            submission_enabled: submissionEnabled,
            daily_submission_limit: dailySubmissionLimit,
        });

        if (result.success) {
            alert('设置已保存');
        } else {
            alert('保存失败: ' + (result.error || '未知错误'));
        }
        setIsSaving(false);
    };

    if (isLoading) {
        return (
            <div className="max-w-4xl flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-[#ff4655] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // 渲染各 Tab 内容
    const renderTabContent = () => {
        switch (activeTab) {
            case 'imageBed':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-white font-medium">选择图床提供商</h4>
                                <p className="text-xs text-gray-500 mt-1">审核通过的点位图片将迁移到此图床</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {imageBedProviderDefinitions.map((def) => (
                                    <button
                                        key={def.provider}
                                        onClick={() => handleProviderSwitch(def.provider)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${ossConfig.provider === def.provider
                                            ? 'bg-[#ff4655]/20 border-[#ff4655] text-white'
                                            : 'border-white/10 text-gray-400 hover:text-white hover:border-white/30'
                                            }`}
                                    >
                                        {def.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
                            {currentDefinition.fields.map((field) => (
                                <div key={`${ossConfig.provider}-${field.key}`} className="flex flex-col gap-1">
                                    <label className="text-xs text-gray-400">
                                        {field.label}
                                        {field.required && <span className="text-red-500 ml-1">*</span>}
                                    </label>
                                    <input
                                        value={(ossConfig[field.key] as string) || ''}
                                        placeholder={field.placeholder}
                                        onChange={(e) => updateOssField(field.key, e.target.value)}
                                        className="w-full bg-[#0f1923] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#ff4655] outline-none transition-colors"
                                    />
                                </div>
                            ))}
                        </div>
                        {/* 配置状态提示 */}
                        <div className={`p-3 rounded-lg border ${isOssConfigValid ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                            <div className="flex items-center gap-2">
                                <Icon name={isOssConfigValid ? 'CheckCircle' : 'AlertTriangle'} size={16} className={isOssConfigValid ? 'text-emerald-400' : 'text-amber-400'} />
                                <span className={`text-sm ${isOssConfigValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {isOssConfigValid ? '图床配置有效' : '请填写所有必填字段'}
                                </span>
                            </div>
                        </div>
                    </div>
                );

            case 'submission':
                return (
                    <div className="space-y-6">
                        {/* 投稿开关 */}
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-white">开启投稿功能</div>
                                <div className="text-xs text-gray-500">
                                    {isOssConfigValid
                                        ? '允许共享库用户投稿点位'
                                        : '请先配置官方图床后再开启'}
                                </div>
                            </div>
                            <button
                                onClick={() => isOssConfigValid && setSubmissionEnabled((prev) => !prev)}
                                disabled={!isOssConfigValid}
                                className={`relative w-12 h-6 rounded-full transition-colors ${!isOssConfigValid
                                    ? 'bg-gray-700 cursor-not-allowed'
                                    : submissionEnabled
                                        ? 'bg-emerald-500'
                                        : 'bg-gray-600'
                                    }`}
                            >
                                <div
                                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${submissionEnabled ? 'left-6' : 'left-0.5'
                                        }`}
                                />
                            </button>
                        </div>

                        {/* 每日投稿限制 */}
                        <div className="pt-4 border-t border-white/10">
                            <label className="block text-sm text-gray-400 mb-2">每日投稿次数限制</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    value={dailySubmissionLimit}
                                    onChange={(e) => setDailySubmissionLimit(parseInt(e.target.value) || 1)}
                                    min={1}
                                    max={50}
                                    className="w-32 px-4 py-2.5 bg-[#0f1923] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff4655]/50"
                                />
                                <span className="text-sm text-gray-500">次/人/天</span>
                            </div>
                        </div>
                    </div>
                );

            case 'download':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">每日下载次数限制</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    value={settings.dailyDownloadLimit}
                                    onChange={(e) =>
                                        setSettings((prev) => ({
                                            ...prev,
                                            dailyDownloadLimit: parseInt(e.target.value) || 0,
                                        }))
                                    }
                                    min={1}
                                    max={100}
                                    className="w-32 px-4 py-2.5 bg-[#0f1923] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff4655]/50"
                                />
                                <span className="text-sm text-gray-500">次/人/天</span>
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                                每个用户每天最多可下载的点位数量
                            </p>
                        </div>
                    </div>
                );

            case 'features':
                return (
                    <div className="space-y-4">
                        {/* 邮箱验证 */}
                        <div className="flex items-center justify-between py-3 border-b border-white/5">
                            <div>
                                <div className="text-sm text-white">强制邮箱验证</div>
                                <div className="text-xs text-gray-500">用户必须验证邮箱才能下载</div>
                            </div>
                            <button
                                onClick={() =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        enableEmailVerification: !prev.enableEmailVerification,
                                    }))
                                }
                                className={`relative w-12 h-6 rounded-full transition-colors ${settings.enableEmailVerification ? 'bg-[#ff4655]' : 'bg-gray-600'
                                    }`}
                            >
                                <div
                                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${settings.enableEmailVerification ? 'left-6' : 'left-0.5'
                                        }`}
                                />
                            </button>
                        </div>

                        {/* 下载日志 */}
                        <div className="flex items-center justify-between py-3 border-b border-white/5">
                            <div>
                                <div className="text-sm text-white">记录下载日志</div>
                                <div className="text-xs text-gray-500">记录用户的下载行为</div>
                            </div>
                            <button
                                onClick={() =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        enableDownloadLogs: !prev.enableDownloadLogs,
                                    }))
                                }
                                className={`relative w-12 h-6 rounded-full transition-colors ${settings.enableDownloadLogs ? 'bg-[#ff4655]' : 'bg-gray-600'
                                    }`}
                            >
                                <div
                                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${settings.enableDownloadLogs ? 'left-6' : 'left-0.5'
                                        }`}
                                />
                            </button>
                        </div>

                        {/* 维护模式 */}
                        <div className="flex items-center justify-between py-3">
                            <div>
                                <div className="text-sm text-white">维护模式</div>
                                <div className="text-xs text-gray-500">开启后共享库暂停访问</div>
                            </div>
                            <button
                                onClick={() =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        maintenanceMode: !prev.maintenanceMode,
                                    }))
                                }
                                className={`relative w-12 h-6 rounded-full transition-colors ${settings.maintenanceMode ? 'bg-orange-500' : 'bg-gray-600'
                                    }`}
                            >
                                <div
                                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${settings.maintenanceMode ? 'left-6' : 'left-0.5'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                );

            case 'domain':
                return (
                    <div className="space-y-4">
                        <p className="text-xs text-gray-500 mb-4">
                            配置后，用户可以从个人库跳转到共享库
                        </p>
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">共享库域名</label>
                            <input
                                type="url"
                                value={libraryUrls.sharedLibraryUrl}
                                onChange={(e) =>
                                    setLibraryUrls((prev) => ({
                                        ...prev,
                                        sharedLibraryUrl: e.target.value,
                                    }))
                                }
                                placeholder="https://shared.example.com"
                                className="w-full px-4 py-2.5 bg-[#0f1923] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff4655]/50"
                            />
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Tab 栏 */}
            <div className="flex items-center gap-1 mb-6 bg-[#1f2326] rounded-xl p-1 border border-white/10">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                            ? 'bg-[#ff4655] text-white'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Icon name={tab.icon} size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab 内容区域 */}
            <div className="bg-[#1f2326] rounded-xl border border-white/10 p-6 min-h-[300px]">
                {renderTabContent()}
            </div>

            {/* 保存按钮 */}
            <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full mt-6 py-3 bg-[#ff4655] hover:bg-[#ff5a67] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isSaving ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        保存中...
                    </>
                ) : (
                    <>
                        <Icon name="Save" size={18} />
                        保存设置
                    </>
                )}
            </button>
        </div>
    );
}

export default SettingsPage;
