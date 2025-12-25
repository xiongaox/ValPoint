/**
 * SettingsPage - 全局系统设置页
 * 
 * 职责：
 * - 配置官方图床 (OSS) 参数
 * - 维护投稿功能开关及每日限额
 * - 管理员名单维护 (仅超级管理员可见)
 * - 域名及下载限制等基础参数配置
 */
import React, { useState, useEffect, useMemo } from 'react';
import Icon from '../../../components/Icon';
import { getSystemSettings, updateSystemSettings } from '../../../lib/systemSettings';
import { ImageBedConfig } from '../../../types/imageBed';
import { defaultImageBedConfig, imageBedProviderMap } from '../../../lib/imageBed';
import { getAdminList, addAdmin, removeAdmin, AdminUser } from '../../../lib/adminService';
import ImageBedConfigForm from '../../../components/ImageBedConfigForm';

interface SettingsPageProps {
    isSuperAdmin: boolean;
}

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
type SettingsTab = 'imageBed' | 'submission' | 'download' | 'features' | 'domain' | 'admins';

const TABS: { id: SettingsTab; label: string; icon: 'Cloud' | 'Send' | 'Download' | 'ToggleLeft' | 'Globe' | 'Shield'; superAdminOnly?: boolean }[] = [
    { id: 'imageBed', label: '官方图床', icon: 'Cloud' },
    { id: 'submission', label: '投稿设置', icon: 'Send' },
    { id: 'download', label: '下载限制', icon: 'Download' },
    { id: 'features', label: '功能开关', icon: 'ToggleLeft' },
    { id: 'domain', label: '域名配置', icon: 'Globe' },
    { id: 'admins', label: '管理员', icon: 'Shield', superAdminOnly: true },
];

/**
 * 系统设置页面 - Tab 布局
 */
function SettingsPage({ isSuperAdmin }: SettingsPageProps) {
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

    // 管理员管理
    const [adminList, setAdminList] = useState<AdminUser[]>([]);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminNickname, setNewAdminNickname] = useState('');
    const [isAddingAdmin, setIsAddingAdmin] = useState(false);
    const [removingAdminId, setRemovingAdminId] = useState<string | null>(null);

    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isOssConfigValid, setIsOssConfigValid] = useState(false);


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
                setSettings(prev => ({
                    ...prev,
                    dailyDownloadLimit: data.daily_download_limit ?? 50
                }));
            }
            setIsLoading(false);
        }
        loadSettings();
    }, []);

    // 加载管理员列表
    useEffect(() => {
        if (isSuperAdmin) {
            getAdminList().then(setAdminList);
        }
    }, [isSuperAdmin]);

    // 添加管理员
    const handleAddAdmin = async () => {
        if (!newAdminEmail.trim()) return;
        setIsAddingAdmin(true);
        const result = await addAdmin(newAdminEmail.trim(), newAdminNickname.trim() || undefined);
        if (result.success) {
            setNewAdminEmail('');
            setNewAdminNickname('');
            const list = await getAdminList();
            setAdminList(list);
        } else {
            alert(result.error || '添加失败');
        }
        setIsAddingAdmin(false);
    };

    // 移除管理员
    const handleRemoveAdmin = async (adminId: string) => {
        if (!confirm('确定要移除该管理员吗？')) return;
        setRemovingAdminId(adminId);
        const result = await removeAdmin(adminId);
        if (result.success) {
            setAdminList((prev) => prev.filter((a) => a.id !== adminId));
        } else {
            alert(result.error || '移除失败');
        }
        setRemovingAdminId(null);
    };



    const handleSave = async () => {
        setIsSaving(true);
        const result = await updateSystemSettings({
            shared_library_url: libraryUrls.sharedLibraryUrl,
            official_oss_config: ossConfig,
            submission_enabled: submissionEnabled,
            daily_submission_limit: dailySubmissionLimit,
            daily_download_limit: settings.dailyDownloadLimit,
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
                        <div>
                            <h4 className="text-white font-medium">官方图床配置</h4>
                            <p className="text-xs text-gray-500 mt-1">审核通过的点位图片将迁移到此图床</p>
                        </div>
                        <ImageBedConfigForm
                            config={ossConfig}
                            onChange={setOssConfig}
                            showProviderSwitch={true}
                            showCopyImport={true}
                            showReset={true}
                            onValidChange={setIsOssConfigValid}
                            layout="full"
                        />
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

            case 'admins':
                return (
                    <div className="space-y-6">
                        {/* 添加管理员 */}
                        <div className="bg-[#0f1923] rounded-xl p-4 border border-white/10">
                            <h4 className="text-white font-medium mb-4">添加管理员</h4>
                            <div className="flex gap-3">
                                <input
                                    type="email"
                                    value={newAdminEmail}
                                    onChange={(e) => setNewAdminEmail(e.target.value)}
                                    placeholder="管理员邮箱"
                                    className="flex-1 px-3 py-2 bg-[#1f2326] border border-white/10 rounded-lg text-white text-sm focus:border-[#ff4655] outline-none"
                                />
                                <input
                                    type="text"
                                    value={newAdminNickname}
                                    onChange={(e) => setNewAdminNickname(e.target.value)}
                                    placeholder="昵称(可选)"
                                    className="w-32 px-3 py-2 bg-[#1f2326] border border-white/10 rounded-lg text-white text-sm focus:border-[#ff4655] outline-none"
                                />
                                <button
                                    onClick={handleAddAdmin}
                                    disabled={isAddingAdmin || !newAdminEmail.trim()}
                                    className="px-4 py-2 bg-[#ff4655] hover:bg-[#ff5a67] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isAddingAdmin ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Icon name="UserPlus" size={16} />
                                    )}
                                    添加
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                输入邮箱添加管理员，该用户登录后即可访问后台
                            </p>
                        </div>

                        {/* 管理员列表 */}
                        <div className="bg-[#0f1923] rounded-xl border border-white/10 overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/10">
                                <h4 className="text-white font-medium">管理员列表</h4>
                            </div>
                            <div className="divide-y divide-white/5">
                                {adminList.map((admin) => (
                                    <div key={admin.id} className="flex items-center justify-between px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${admin.role === 'super_admin'
                                                ? 'bg-amber-500/20 text-amber-400'
                                                : 'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                <Icon name={admin.role === 'super_admin' ? 'Crown' : 'Shield'} size={16} />
                                            </div>
                                            <div>
                                                <div className="text-sm text-white flex items-center gap-2">
                                                    {admin.nickname || admin.email?.split('@')[0] || 'Unknown'}
                                                    {admin.role === 'super_admin' && (
                                                        <span className="text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">超级管理员</span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500">{admin.email}</div>
                                            </div>
                                        </div>
                                        {admin.role !== 'super_admin' && (
                                            <button
                                                onClick={() => handleRemoveAdmin(admin.id)}
                                                disabled={removingAdminId === admin.id}
                                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                                title="移除管理员"
                                            >
                                                {removingAdminId === admin.id ? (
                                                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Icon name="UserMinus" size={16} />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {adminList.length === 0 && (
                                    <div className="py-8 text-center text-gray-500 text-sm">
                                        暂无管理员
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    // 过滤标签页（超级管理员才能看到管理员标签）
    const visibleTabs = TABS.filter((tab) => !tab.superAdminOnly || isSuperAdmin);

    return (
        <div className="max-w-4xl mx-auto">
            {/* Tab 栏 */}
            <div className="flex items-center gap-1 mb-6 bg-[#1f2326] rounded-xl p-1 border border-white/10">
                {visibleTabs.map((tab) => (
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
