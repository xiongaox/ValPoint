/**
 * SharedMainView - 共享库主页面视图
 * 
 * 职责：
 * - 组装左侧侧边栏、中心地图和右侧面板
 * - 集成投稿弹窗、用户卡片、快捷操作等功能
 * - 管理应用中的顶级交互弹窗状态
 * - 响应式布局：移动端隐藏左右面板，使用弹窗选择器
 */
import React, { useState, useEffect, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import LeafletMap from '../../components/LeafletMap';
import LeftPanel from '../../components/LeftPanel';
import SharedRightPanel from './SharedRightPanel';
import MapPickerModal from '../../components/MapPickerModal';
import ViewerModal from '../../components/ViewerModal';
import SharedFilterModal from '../../components/SharedFilterModal';
import SubmitLineupModal from './SubmitLineupModal';
import { useSharedController } from './useSharedController';
import { getSystemSettings } from '../../lib/systemSettings';
import AuthorLinksBar from '../../components/AuthorLinksBar';

// 引入新组件
import LibrarySwitchButton from '../../components/LibrarySwitchButton';
import SharedQuickActions from './components/SharedQuickActions';
import CompactUserCard from '../../components/CompactUserCard';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import UserProfileModal from './components/UserProfileModal';
import ChangelogModal from '../../components/ChangelogModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { useEmailAuth } from '../../hooks/useEmailAuth';
import { useUserProfile } from '../../hooks/useUserProfile';

// 移动端组件
import { useIsMobile } from '../../hooks/useIsMobile';
import MobileAgentPicker from '../../components/MobileAgentPicker';
import MobileMapPicker from '../../components/MobileMapPicker';
import MobileLineupList from '../../components/MobileLineupList';
import Icon from '../../components/Icon';
import { getAbilityList, getAbilityIcon } from '../../utils/abilityIcons';

interface SharedMainViewProps {
    user: User | null; // 可选，未登录也可以浏览
    onSignOut: () => void;
    setAlertMessage: (msg: string | null) => void;
    setViewingImage: (img: { src: string; list?: string[]; index?: number } | null) => void;
    onRequestLogin: () => void; // 下载时请求登录
}

function SharedMainView({ user, onSignOut, setAlertMessage, setViewingImage, onRequestLogin }: SharedMainViewProps) {
    const controller = useSharedController({ user, setAlertMessage, setViewingImage, onRequestLogin });
    const { updateProfile, resetPassword } = useEmailAuth();
    const { profile } = useUserProfile(); // 获取用户 custom_id
    const [activeTab, setActiveTab] = useState<'view' | 'submit' | 'pending'>('view');
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [submissionEnabled, setSubmissionEnabled] = useState(false);

    // 移动端检测
    const isMobile = useIsMobile();
    const [isMobileAgentPickerOpen, setIsMobileAgentPickerOpen] = useState(false);
    const [isMobileMapPickerOpen, setIsMobileMapPickerOpen] = useState(false);
    const [isMobileLineupListOpen, setIsMobileLineupListOpen] = useState(false);
    const [isMobileUserMenuOpen, setIsMobileUserMenuOpen] = useState(false); // 用户下拉菜单

    // 快捷功能状态
    const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

    const [isChangelogOpen, setIsChangelogOpen] = useState(false);
    const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

    // 个人库 URL（用于移动端跳转）
    const [personalLibraryUrl, setPersonalLibraryUrl] = useState<string>('');

    // 移动端技能过滤（存储被禁用的技能索引）
    const [disabledAbilities, setDisabledAbilities] = useState<Set<number>>(new Set());

    // 根据禁用技能过滤点位（移动端）
    const mobileFilteredLineups = useMemo(() => {
        if (!isMobile || disabledAbilities.size === 0) {
            return controller.filteredLineups;
        }
        return controller.filteredLineups.filter(l =>
            l.abilityIndex === null || !disabledAbilities.has(l.abilityIndex)
        );
    }, [isMobile, disabledAbilities, controller.filteredLineups]);

    // 加载投稿开关状态
    useEffect(() => {
        async function loadSubmissionStatus() {
            const settings = await getSystemSettings();
            if (settings) {
                setSubmissionEnabled(settings.submission_enabled ?? false);
            }
        }
        loadSubmissionStatus();
    }, []);

    // 加载个人库 URL（用于移动端跳转）
    useEffect(() => {
        async function loadPersonalLibraryUrl() {
            // 环境变量优先
            const envUrl = (window as any).__ENV__?.VITE_PERSONAL_LIBRARY_URL
                || import.meta.env.VITE_PERSONAL_LIBRARY_URL
                || '';
            if (envUrl) {
                setPersonalLibraryUrl(envUrl);
                return;
            }
            // 从数据库配置获取
            const settings = await getSystemSettings();
            if (settings) {
                // 默认使用相对路径
                setPersonalLibraryUrl('/user.html');
            } else {
                // 默认使用相对路径
                setPersonalLibraryUrl('/user.html');
            }
        }
        loadPersonalLibraryUrl();
    }, []);

    // 记录打开投稿弹窗前的Tab（用于关闭时恢复）
    const [previousTab, setPreviousTab] = useState<'view' | 'pending'>('view');

    // 关闭投稿弹窗时，恢复到之前的Tab
    const handleSubmitModalClose = () => {
        setIsSubmitModalOpen(false);
    };

    // 打开投稿弹窗（不改变 activeTab，避免界面闪烁）
    const handleOpenSubmit = () => {
        setPreviousTab(activeTab as 'view' | 'pending');
        setIsSubmitModalOpen(true);
    };

    return (
        <div className="flex h-screen w-screen bg-[#0f1923] text-white overflow-hidden">
            {/* 左侧面板 - 仅桌面端显示 */}
            {!isMobile && (
                <LeftPanel
                    activeTab="view"
                    selectedMap={controller.selectedMap}
                    setIsMapModalOpen={controller.setIsMapModalOpen}
                    selectedSide={controller.selectedSide}
                    setSelectedSide={controller.setSelectedSide}
                    selectedAgent={controller.selectedAgent}
                    setSelectedAgent={controller.setSelectedAgent}
                    agents={controller.agents}
                    agentCounts={controller.agentCounts}
                    selectedAbilityIndex={controller.selectedAbilityIndex}
                    setSelectedAbilityIndex={controller.setSelectedAbilityIndex}
                    setIsPreviewModalOpen={() => { }}
                    getMapDisplayName={controller.getMapDisplayName}
                    openChangelog={() => setIsChangelogOpen(true)}
                />
            )}

            {/* 中间地图区域 */}
            <div className={`flex-1 relative bg-[#0f1923] z-0 ${!isMobile ? 'border-l border-r border-white/10' : ''}`}>
                <LeafletMap
                    mapIcon={controller.mapIcon}
                    mapCover={controller.mapCover}
                    activeTab="view"
                    lineups={mobileFilteredLineups}
                    selectedLineupId={controller.selectedLineupId}
                    onLineupSelect={controller.setSelectedLineupId}
                    newLineupData={controller.newLineupData}
                    setNewLineupData={controller.setNewLineupData}
                    placingType={controller.placingType}
                    setPlacingType={controller.setPlacingType}
                    selectedAgent={controller.selectedAgent}
                    selectedAbilityIndex={controller.selectedAbilityIndex}
                    onViewLineup={controller.handleViewLineup}
                    isFlipped={controller.selectedSide === 'defense'}
                    sharedLineup={controller.selectedLineup}
                />

                {/* 桌面端叠加元素 */}
                {!isMobile && (
                    <>
                        {/* 用户信息卡片 (左上角) */}
                        <div className="absolute top-3 left-3 z-10 flex items-center gap-3">
                            {user && (
                                <LibrarySwitchButton
                                    currentLibrary="shared"
                                    onSharedClick={() => setIsSubscriptionModalOpen(true)}
                                />
                            )}



                            <CompactUserCard
                                user={user}
                                onSignOut={onSignOut}
                                onRequestLogin={onRequestLogin}
                            />
                        </div>

                        {/* 作者信息快捷按钮 (右上角) */}
                        <div className="absolute top-3 right-3 z-10">
                            <AuthorLinksBar />
                        </div>



                        {/* 快捷功能按钮 (仅登录可见) */}
                        {user && (
                            <SharedQuickActions
                                isOpen={isQuickActionsOpen}
                                onToggle={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
                                onChangePassword={() => {
                                    setIsQuickActionsOpen(false);
                                    setIsChangePasswordOpen(true);
                                }}
                                onUserProfile={() => {
                                    setIsQuickActionsOpen(false);
                                    setIsProfileModalOpen(true);
                                }}
                            />
                        )}
                    </>
                )}

                {/* 移动端布局 */}
                {isMobile && (
                    <>
                        {/* 左上角：库切换 Tab（移动端样式） */}
                        <div className="absolute top-3 left-3 z-10">
                            <div className="flex bg-black/60 backdrop-blur-sm rounded-xl border border-white/10 p-1.5">
                                <a
                                    href={personalLibraryUrl || '/'}
                                    className="px-4 h-[32px] flex items-center justify-center rounded-lg text-sm font-medium transition-all text-gray-400 hover:text-white"
                                >
                                    个人库
                                </a>
                                <button
                                    onClick={() => setIsSubscriptionModalOpen(true)}
                                    className={`px-4 h-[32px] flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${controller.currentSubscription.id === 'local' ? 'bg-[#17b890] text-white' : 'bg-[#ff4655] text-white'
                                        }`}
                                >
                                    {controller.currentSubscription.name === '官方库 (Official)' ? '共享库' : controller.currentSubscription.name}
                                </button>
                            </div>
                        </div>

                        {/* 右上角：用户胶囊按钮 + 列表按钮 */}
                        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                            {user ? (
                                <div className="flex bg-black/60 backdrop-blur-sm rounded-xl border border-white/10 p-1.5 items-center gap-2">
                                    {/* 左侧：头像 → 个人中心 */}
                                    <button
                                        onClick={() => setIsProfileModalOpen(true)}
                                        className="w-[32px] h-[32px] flex items-center justify-center rounded-lg overflow-hidden hover:bg-white/10 transition-colors"
                                        title="个人中心"
                                    >
                                        {profile?.avatar ? (
                                            <img
                                                src={profile.avatar.startsWith('/') || profile.avatar.startsWith('http') ? profile.avatar : `/agents/${profile.avatar}`}
                                                alt=""
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                }}
                                            />
                                        ) : null}
                                        <span className={`text-white text-xs font-bold ${profile?.avatar ? 'hidden' : ''}`}>
                                            {(profile?.nickname || profile?.custom_id || user.email)?.[0]?.toUpperCase() || 'U'}
                                        </span>
                                    </button>
                                    {/* 右侧：退出按钮 - 红色选中状态 */}
                                    <button
                                        onClick={onSignOut}
                                        className="px-5 h-[32px] bg-[#ff4655] rounded-lg text-white text-sm font-medium hover:bg-[#ff5b6b] transition-colors"
                                        title="退出登录"
                                    >
                                        退出
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={onRequestLogin}
                                    className="w-[46px] h-[46px] flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl border border-white/10"
                                    title="登录"
                                >
                                    <Icon name="User" size={20} className="text-white" />
                                </button>
                            )}
                            {/* 点位列表入口 */}
                            <button
                                onClick={() => setIsMobileLineupListOpen(true)}
                                className="w-[46px] h-[46px] flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl border border-white/10"
                                title="点位列表"
                            >
                                <Icon name="List" size={20} className="text-white" />
                            </button>
                        </div>

                        {/* 底部工具栏：地图 | 攻防 | 角色 - 同一水平线 */}
                        <div className="absolute bottom-12 left-3 right-3 z-10 flex items-center justify-between gap-2">
                            {/* 左侧：地图选择 - 胶囊按钮 */}
                            <button
                                onClick={() => setIsMobileMapPickerOpen(true)}
                                className="flex items-center gap-2 px-3 h-[46px] bg-black/60 backdrop-blur-sm rounded-xl border border-white/10"
                            >
                                <Icon name="Map" size={18} className="text-[#ff4655]" />
                                <span className="text-white text-sm font-medium max-w-[70px] truncate">{controller.getMapDisplayName(controller.selectedMap?.displayName || '') || '地图'}</span>
                            </button>

                            {/* 中间：攻防切换 */}
                            <div className="flex bg-black/60 backdrop-blur-sm rounded-xl border border-white/10 p-1.5">
                                <button
                                    onClick={() => controller.setSelectedSide('attack')}
                                    className={`px-3 h-[32px] rounded-lg text-sm font-medium whitespace-nowrap transition-all ${controller.selectedSide === 'attack'
                                        ? 'bg-[#ff4655] text-white'
                                        : 'text-gray-400'
                                        }`}
                                >
                                    进攻
                                </button>
                                <button
                                    onClick={() => controller.setSelectedSide('defense')}
                                    className={`px-4 h-[32px] rounded-lg text-sm font-medium whitespace-nowrap transition-all ${controller.selectedSide === 'defense'
                                        ? 'bg-emerald-500 text-white'
                                        : 'text-gray-400'
                                        }`}
                                >
                                    防守
                                </button>
                            </div>

                            {/* 右侧：角色选择 - Tab 样式 */}
                            <div className="flex bg-black/60 backdrop-blur-sm rounded-xl border border-white/10 p-1.5">
                                <button
                                    onClick={() => setIsMobileAgentPickerOpen(true)}
                                    className="flex items-center gap-2 px-1 h-[32px] rounded-lg"
                                >
                                    <img
                                        src={controller.selectedAgent?.displayIcon || `/agents/${controller.selectedAgent?.displayName || 'default'}.webp`}
                                        alt=""
                                        className="w-7 h-7 rounded-lg object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/agents/default.webp';
                                        }}
                                    />
                                    <span className="text-white text-sm font-medium max-w-[60px] truncate">{controller.selectedAgent?.displayName || '角色'}</span>
                                </button>
                            </div>
                        </div>

                        {/* 右上角：技能过滤图标（点位列表下方）*/}
                        {controller.selectedAgent && (
                            <div className="absolute top-20 right-3.5 z-10 flex flex-col gap-4">
                                {getAbilityList(controller.selectedAgent).map((ability: any, idx: number) => {
                                    const iconUrl = getAbilityIcon(controller.selectedAgent!, idx);
                                    const isDisabled = disabledAbilities.has(idx);
                                    const isSelected = !isDisabled; // 选中 = 未禁用
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setDisabledAbilities(prev => {
                                                    const next = new Set(prev);
                                                    if (next.has(idx)) {
                                                        next.delete(idx);
                                                    } else {
                                                        next.add(idx);
                                                    }
                                                    return next;
                                                });
                                            }}
                                            className={`w-10 h-10 rounded-xl border-2 backdrop-blur-sm transition-all flex items-center justify-center ${isSelected
                                                ? 'bg-[#ff4655] border-[#ff4655] shadow-lg shadow-red-500/30'
                                                : 'bg-black/40 border-white/10 opacity-50'
                                                }`}
                                            title={ability.displayName || `技能${idx + 1}`}
                                        >
                                            {iconUrl ? (
                                                <img
                                                    src={iconUrl}
                                                    alt=""
                                                    className={`w-6 h-6 object-contain ${isSelected ? 'brightness-0 invert' : ''}`}
                                                />
                                            ) : (
                                                <span className="text-white text-sm font-bold">{idx + 1}</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* 右侧面板 - 仅桌面端显示 */}
            {!isMobile && (
                <SharedRightPanel
                    activeTab={activeTab}
                    onTabSwitch={(tab) => {
                        if (tab === 'submit') {
                            handleOpenSubmit();
                        } else {
                            setActiveTab(tab);
                        }
                    }}
                    isLoading={controller.isLoading}
                    searchQuery={controller.searchQuery}
                    setSearchQuery={controller.setSearchQuery}
                    selectedSide={controller.selectedSide}
                    setSelectedSide={controller.setSelectedSide}
                    filteredLineups={controller.filteredLineups}
                    selectedLineupId={controller.selectedLineupId}
                    handleViewLineup={controller.handleViewLineup}
                    handleDownload={controller.handleDownload}
                    getMapDisplayName={controller.getMapDisplayName}
                    onOpenFilter={() => controller.setIsFilterModalOpen(true)}
                    userId={user?.id}
                    submissionEnabled={submissionEnabled}
                />
            )}

            {/* 地图选择弹窗 - 桌面端 */}
            <MapPickerModal
                isOpen={controller.isMapModalOpen}
                maps={controller.maps}
                selectedMap={controller.selectedMap}
                setSelectedMap={controller.setSelectedMap}
                setIsMapModalOpen={controller.setIsMapModalOpen}
                getMapDisplayName={controller.getMapDisplayName}
            />

            {/* 移动端角色选择弹窗 */}
            <MobileAgentPicker
                isOpen={isMobileAgentPickerOpen}
                onClose={() => setIsMobileAgentPickerOpen(false)}
                agents={controller.agents}
                selectedAgent={controller.selectedAgent}
                onSelect={controller.setSelectedAgent}
                agentCounts={controller.agentCounts}
            />

            {/* 移动端地图选择弹窗 */}
            <MobileMapPicker
                isOpen={isMobileMapPickerOpen}
                onClose={() => setIsMobileMapPickerOpen(false)}
                maps={controller.maps}
                selectedMap={controller.selectedMap}
                onSelect={controller.setSelectedMap}
            />

            {/* 移动端点位列表弹窗 */}
            <MobileLineupList
                isOpen={isMobileLineupListOpen}
                onClose={() => setIsMobileLineupListOpen(false)}
                lineups={mobileFilteredLineups}
                selectedLineupId={controller.selectedLineupId}
                onSelectLineup={controller.setSelectedLineupId}
                isLoading={controller.isLoading}
            />

            {/* 点位详情弹窗 */}
            <ViewerModal
                viewingLineup={controller.viewingLineup}
                onClose={controller.handleViewerClose}
                handleEditStart={() => { }}
                setViewingImage={setViewingImage}
                getMapDisplayName={controller.getMapDisplayName}
                getMapEnglishName={controller.getMapEnglishName}
                isGuest={!user}
                handleCopyShared={(lineup: any) => {
                    if (lineup) controller.handleDownload(lineup.id);
                }}
                isSavingShared={controller.isDownloading}
            />

            {/* 共享者筛选弹窗 - 桌面端 */}
            <SharedFilterModal
                isOpen={controller.isFilterModalOpen}
                contributors={controller.contributors}
                selectedUserId={controller.selectedSharedUserId}
                onSelect={controller.setSelectedSharedUserId}
                onClose={() => controller.setIsFilterModalOpen(false)}
            />

            {/* 投稿弹窗 */}
            <SubmitLineupModal
                isOpen={isSubmitModalOpen}
                onClose={handleSubmitModalClose}
                userId={user?.id || null}
                userEmail={profile?.custom_id || profile?.nickname || user?.email}
                setAlertMessage={setAlertMessage}
                onSuccess={() => {
                    setActiveTab('pending');
                }}
            />

            {/* 修改密码弹窗 */}
            <ChangePasswordModal
                isOpen={isChangePasswordOpen}
                isChangingPassword={isPasswordSubmitting}
                onClose={() => setIsChangePasswordOpen(false)}
                onChangePasswordSubmit={async (oldPwd: string, newPwd: string, confirmPwd: string) => {
                    if (newPwd !== confirmPwd) {
                        setAlertMessage('两次输入的新密码不一致');
                        return;
                    }
                    if (newPwd.length < 6) {
                        setAlertMessage('新密码至少需要6位');
                        return;
                    }
                    setIsPasswordSubmitting(true);

                    const { error: updateError } = await import('../../supabaseClient').then(m => m.supabase.auth.updateUser({
                        password: newPwd
                    }));

                    setIsPasswordSubmitting(false);

                    if (updateError) {
                        setAlertMessage(updateError.message);
                    } else {
                        setAlertMessage('密码修改成功');
                        setIsChangePasswordOpen(false);
                    }
                }}
            />

            {/* 个人信息弹窗 */}
            <UserProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                setAlertMessage={setAlertMessage}
            />

            {/* 更新日志弹窗 */}
            <ChangelogModal
                isOpen={isChangelogOpen}
                onClose={() => setIsChangelogOpen(false)}
            />

            {/* 订阅管理弹窗 */}
            <SubscriptionModal
                isOpen={isSubscriptionModalOpen}
                onClose={() => setIsSubscriptionModalOpen(false)}
                subscriptions={controller.subscriptions}
                currentSubscription={controller.currentSubscription}
                onSetSubscription={(sub) => {
                    controller.setSubscription(sub);
                    setIsSubscriptionModalOpen(false);
                }}
                onAddSubscription={controller.addSubscription}
                onRemoveSubscription={controller.removeSubscription}
                onUpdateSubscription={controller.updateSubscription}
                onReorderSubscription={controller.reorderSubscription}

            />
        </div>
    );
}

export default SharedMainView;
