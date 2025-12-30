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
import AlertModal from '../../../components/AlertModal';
import { getSystemSettings, updateSystemSettings } from '../../../lib/systemSettings';
import { ImageBedConfig } from '../../../types/imageBed';
import { defaultImageBedConfig, imageBedProviderMap } from '../../../lib/imageBed';
import { getAdminList, addAdmin, removeAdmin, AdminUser } from '../../../lib/adminService';
import ImageBedConfigForm from '../../../components/ImageBedConfigForm';
import { AuthorLinks, defaultAuthorLinks } from '../../../types/authorLinks';

interface SettingsPageProps {
    isSuperAdmin: boolean;
}

interface Settings {
    dailyDownloadLimit: number;
    enableEmailVerification: boolean;
    enableDownloadLogs: boolean;
    maintenanceMode: boolean;
}


// Tab 配置
type SettingsTab = 'imageBed' | 'submission' | 'download' | 'features' | 'authorInfo' | 'admins';

const TABS: { id: SettingsTab; label: string; icon: 'Cloud' | 'Send' | 'Download' | 'ToggleLeft' | 'Globe' | 'Shield' | 'User'; superAdminOnly?: boolean }[] = [
    { id: 'imageBed', label: '官方图床', icon: 'Cloud' },
    { id: 'submission', label: '投稿设置', icon: 'Send' },
    { id: 'download', label: '下载限制', icon: 'Download' },
    { id: 'features', label: '功能开关', icon: 'ToggleLeft' },
    { id: 'authorInfo', label: '作者信息', icon: 'User' },
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
    // 官方图床配置
    const [ossConfig, setOssConfig] = useState<ImageBedConfig>(defaultImageBedConfig);
    const [submissionEnabled, setSubmissionEnabled] = useState(false);
    const [dailySubmissionLimit, setDailySubmissionLimit] = useState(10);
    // 作者信息链接
    const [authorLinks, setAuthorLinks] = useState<AuthorLinks>(defaultAuthorLinks);

    // 管理员管理
    const [adminList, setAdminList] = useState<AdminUser[]>([]);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminNickname, setNewAdminNickname] = useState('');
    const [isAddingAdmin, setIsAddingAdmin] = useState(false);
    const [removingAdminId, setRemovingAdminId] = useState<string | null>(null);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [confirmState, setConfirmState] = useState<{
        message: string;
        onConfirm: () => void;
    } | null>(null);

    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isOssConfigValid, setIsOssConfigValid] = useState(false);


    // 从 Supabase 加载设置
    useEffect(() => {
        async function loadSettings() {
            setIsLoading(true);
            const data = await getSystemSettings();
            if (data) {
                if (data.official_oss_config) {
                    setOssConfig(data.official_oss_config);
                }
                setSubmissionEnabled(data.submission_enabled ?? false);
                setDailySubmissionLimit(data.daily_submission_limit ?? 10);
                setSettings(prev => ({
                    ...prev,
                    dailyDownloadLimit: data.daily_download_limit ?? 50
                }));
                // 加载作者信息链接
                if (data.author_links) {
                    setAuthorLinks(data.author_links);
                }
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
            setAlertMessage(result.error || '添加失败');
        }
        setIsAddingAdmin(false);
    };

    // 移除管理员
    const handleRemoveAdmin = async (adminId: string) => {
        setConfirmState({
            message: '确定要移除该管理员吗？',
            onConfirm: async () => {
                setConfirmState(null);
                setRemovingAdminId(adminId);
                const result = await removeAdmin(adminId);
                if (result.success) {
                    setAdminList((prev) => prev.filter((a) => a.id !== adminId));
                } else {
                    setAlertMessage(result.error || '移除失败');
                }
                setRemovingAdminId(null);
            }
        });
    };



    const handleSave = async () => {

        setIsSaving(true);
        const result = await updateSystemSettings({
            official_oss_config: ossConfig,
            submission_enabled: submissionEnabled,
            daily_submission_limit: dailySubmissionLimit,
            daily_download_limit: settings.dailyDownloadLimit,
            author_links: authorLinks,
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
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Icon name="Cloud" size={18} className="text-[#ff4655]" />
                                官方图床配置
                            </h3>
                            <p className="text-xs text-gray-500 mb-4">审核通过的点位图片将迁移到此图床</p>
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
                    </div>
                );

            case 'submission':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Icon name="Send" size={18} className="text-[#ff4655]" />
                                投稿设置
                            </h3>
                            <p className="text-xs text-gray-500 mb-4">管理用户投稿点位的相关设置</p>

                            <div className="space-y-4">
                                {/* 投稿开关 */}
                                <div className="flex items-center justify-between p-4 bg-[#0f1923] rounded-lg border border-white/10">
                                    <div>
                                        <div className="text-sm text-white font-medium">开启投稿功能</div>
                                        <div className="text-xs text-gray-500 mt-1">
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
                                <div>
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
                        </div>
                    </div>
                );

            case 'download':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Icon name="Download" size={18} className="text-[#ff4655]" />
                                下载限制
                            </h3>
                            <p className="text-xs text-gray-500 mb-4">控制用户每日下载点位的数量上限</p>

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
                            </div>
                        </div>
                    </div>
                );

            case 'features':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Icon name="Settings" size={18} className="text-[#ff4655]" />
                                功能开关
                            </h3>
                            <p className="text-xs text-gray-500 mb-4">管理系统各项功能的开启与关闭</p>

                            <div className="space-y-3">
                                {/* 邮箱验证 */}
                                <div className="flex items-center justify-between p-4 bg-[#0f1923] rounded-lg border border-white/10">
                                    <div>
                                        <div className="text-sm text-white font-medium">强制邮箱验证</div>
                                        <div className="text-xs text-gray-500 mt-1">用户必须验证邮箱才能下载</div>
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
                                <div className="flex items-center justify-between p-4 bg-[#0f1923] rounded-lg border border-white/10">
                                    <div>
                                        <div className="text-sm text-white font-medium">记录下载日志</div>
                                        <div className="text-xs text-gray-500 mt-1">记录用户的下载行为</div>
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
                                <div className="flex items-center justify-between p-4 bg-[#0f1923] rounded-lg border border-white/10">
                                    <div>
                                        <div className="text-sm text-white font-medium">维护模式</div>
                                        <div className="text-xs text-gray-500 mt-1">开启后共享库暂停访问</div>
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
                        </div>
                    </div>
                );


            case 'admins':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Icon name="Users" size={18} className="text-[#ff4655]" />
                                管理员管理
                            </h3>
                            <p className="text-xs text-gray-500 mb-4">添加或移除系统管理员权限</p>
                        </div>

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

            case 'authorInfo':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Icon name="Link" size={18} className="text-[#ff4655]" />
                                外部链接
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">GitHub 项目地址</label>
                                    <input
                                        type="url"
                                        value={authorLinks.github_url}
                                        onChange={(e) => setAuthorLinks(prev => ({ ...prev, github_url: e.target.value }))}
                                        placeholder="https://github.com/username/repo"
                                        className="w-full px-4 py-3 rounded-lg bg-[#0f1923] border border-white/10 text-white focus:border-[#ff4655] focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">使用教程地址</label>
                                    <input
                                        type="url"
                                        value={authorLinks.tutorial_url}
                                        onChange={(e) => setAuthorLinks(prev => ({ ...prev, tutorial_url: e.target.value }))}
                                        placeholder="https://example.com/tutorial"
                                        className="w-full px-4 py-3 rounded-lg bg-[#0f1923] border border-white/10 text-white focus:border-[#ff4655] focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/10">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Icon name="QrCode" size={18} className="text-[#ff4655]" />
                                二维码配置
                            </h3>
                            <p className="text-xs text-gray-500 mb-4">填入二维码图片的 URL 地址</p>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">微信收款码</label>
                                    <input
                                        type="url"
                                        value={authorLinks.donate_wechat_qr}
                                        onChange={(e) => setAuthorLinks(prev => ({ ...prev, donate_wechat_qr: e.target.value }))}
                                        placeholder="https://example.com/wechat-pay.jpg"
                                        className="w-full px-4 py-3 rounded-lg bg-[#0f1923] border border-white/10 text-white focus:border-[#ff4655] focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">支付宝收款码</label>
                                    <input
                                        type="url"
                                        value={authorLinks.donate_alipay_qr}
                                        onChange={(e) => setAuthorLinks(prev => ({ ...prev, donate_alipay_qr: e.target.value }))}
                                        placeholder="https://example.com/alipay.jpg"
                                        className="w-full px-4 py-3 rounded-lg bg-[#0f1923] border border-white/10 text-white focus:border-[#ff4655] focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">微信联系二维码</label>
                                    <input
                                        type="url"
                                        value={authorLinks.contact_wechat_qr}
                                        onChange={(e) => setAuthorLinks(prev => ({ ...prev, contact_wechat_qr: e.target.value }))}
                                        placeholder="https://example.com/wechat-contact.jpg"
                                        className="w-full px-4 py-3 rounded-lg bg-[#0f1923] border border-white/10 text-white focus:border-[#ff4655] focus:outline-none"
                                    />
                                </div>
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
        <div className="w-full">
            {/* Tab 栏 - 使用负边距抵消父容器padding */}
            <div className="flex items-center mb-6 bg-[#1f2326] -mx-6 -mt-6">
                {visibleTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-lg text-base font-medium transition-all ${activeTab === tab.id
                            ? 'bg-[#ff4655] text-white'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Icon name={tab.icon} size={20} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 内容区域 - 保持原有宽度 */}
            <div className="max-w-4xl mx-auto">
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

                {/* 确认弹窗 */}
                <AlertModal
                    message={confirmState?.message ?? null}
                    onClose={() => setConfirmState(null)}
                    actionLabel="取消"
                    secondaryLabel="确定"
                    onSecondary={confirmState?.onConfirm}
                />

                {/* 消息弹窗 */}
                <AlertModal
                    message={alertMessage}
                    onClose={() => setAlertMessage(null)}
                />
            </div>
        </div>
    );
}

export default SettingsPage;
