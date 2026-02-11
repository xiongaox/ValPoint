/**
 * SharedMainView - 共享库主视图
 *
 * 职责：
 * - 组织共享库主视图的整体布局与关键区域。
 * - 协调路由、筛选或 Tab 等顶层状态。
 * - 整合数据来源与子组件的交互。
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
import LibrarySwitchButton from '../../components/LibrarySwitchButton';



import SharedQuickActions from './components/SharedQuickActions';
import CompactUserCard from '../../components/CompactUserCard';
import UserAvatar from '../../components/UserAvatar';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import UserProfileModal from './components/UserProfileModal';
import ChangelogModal from '../../components/ChangelogModal';

import AlertModal from '../../components/AlertModal';
import { useEmailAuth } from '../../hooks/useEmailAuth';
import { useUserProfile } from '../../hooks/useUserProfile';

import { useDeviceMode } from '../../hooks/useDeviceMode';
import MobileAgentPicker from '../../components/MobileAgentPicker';
import MobileMapPicker from '../../components/MobileMapPicker';
import MobileLineupList from '../../components/MobileLineupList';
import Icon from '../../components/Icon';
import ICPFooter from '../../components/ICPFooter';
import { getAbilityList, getAbilityIcon } from '../../utils/abilityIcons';

interface SharedMainViewProps {
    user: User | null; // 说明：可选，未登录也可浏览。
    onSignOut: () => void;
    setAlertMessage: (msg: string | null) => void;
    setViewingImage: (img: { src: string; list?: string[]; index?: number } | null) => void;
    onRequestLogin: () => void; // 说明：下载受限内容时提示登录。
}

function SharedMainView({ user, onSignOut, setAlertMessage, setViewingImage, onRequestLogin }: SharedMainViewProps) {
    const controller = useSharedController({ user, setAlertMessage, setViewingImage, onRequestLogin });
    const { updateProfile, resetPassword } = useEmailAuth();
    const { profile } = useUserProfile(); // 说明：读取用户 custom_id。
    const [activeTab, setActiveTab] = useState<'view' | 'submit' | 'pending'>('view');
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [submissionEnabled, setSubmissionEnabled] = useState(false);

    const deployPlatform = (window as any).__ENV__?.VITE_DEPLOY_PLATFORM
        || import.meta.env.VITE_DEPLOY_PLATFORM;

    const { isMobile, isTabletLandscape } = useDeviceMode();
    const isDesktop = !isMobile && !isTabletLandscape;
    const [isMobileAgentPickerOpen, setIsMobileAgentPickerOpen] = useState(false);
    const [isMobileMapPickerOpen, setIsMobileMapPickerOpen] = useState(false);
    const [isMobileLineupListOpen, setIsMobileLineupListOpen] = useState(false);
    const [isMobileUserMenuOpen, setIsMobileUserMenuOpen] = useState(false); // 说明：用户菜单状态。
    const [isTabletRightPanelOpen, setIsTabletRightPanelOpen] = useState(false);

    const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

    const [isChangelogOpen, setIsChangelogOpen] = useState(false);



    const [personalLibraryUrl, setPersonalLibraryUrl] = useState<string>('');

    const [disabledAbilities, setDisabledAbilities] = useState<Set<number>>(new Set());

    const mobileFilteredLineups = useMemo(() => {
        if (!isMobile || disabledAbilities.size === 0) {
            return controller.filteredLineups;
        }
        return controller.filteredLineups.filter(l =>
            l.abilityIndex === null || !disabledAbilities.has(l.abilityIndex)
        );
    }, [isMobile, disabledAbilities, controller.filteredLineups]);

    useEffect(() => {
        async function loadSubmissionStatus() {
            const settings = await getSystemSettings();
            if (settings) {
                setSubmissionEnabled(settings.submission_enabled ?? false);
            }
        }
        loadSubmissionStatus();
    }, []);

    useEffect(() => {
        async function loadPersonalLibraryUrl() {
            const envUrl = (window as any).__ENV__?.VITE_PERSONAL_LIBRARY_URL
                || import.meta.env.VITE_PERSONAL_LIBRARY_URL
                || '';
            if (envUrl) {
                setPersonalLibraryUrl(envUrl);
                return;
            }
            const settings = await getSystemSettings();
            if (settings) {
                setPersonalLibraryUrl('/user.html');
            } else {
                setPersonalLibraryUrl('/user.html');
            }
        }
        loadPersonalLibraryUrl();
    }, []);

    useEffect(() => {
        if (!isTabletLandscape) {
            setIsTabletRightPanelOpen(false);
        }
    }, [isTabletLandscape]);

    const [previousTab, setPreviousTab] = useState<'view' | 'pending'>('view');

    const handleSubmitModalClose = () => {
        setIsSubmitModalOpen(false);
    };

    const handleOpenSubmit = () => {
        setPreviousTab(activeTab as 'view' | 'pending');
        setIsSubmitModalOpen(true);
    };

    return (
        <div className="flex h-screen w-screen bg-[#0f1923] text-white overflow-hidden">
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
                    onReset={controller.handleReset}
                    layoutMode={isTabletLandscape ? 'tablet-compact' : 'desktop'}
                />
            )}

            <div className={`flex-1 relative bg-[#0f1923] z-0 ${!isMobile ? 'border-l border-r border-white/10' : ''}`}>
                <LeafletMap
                    mapIcon={controller.mapIcon}
                    mapCover={controller.mapCover}
                    activeTab="view"
                    lineups={mobileFilteredLineups}
                    selectedLineupId={controller.selectedLineupId}
                    onLineupSelect={(id) => {
                        controller.setSelectedLineupId(id);
                        if (isTabletLandscape && id === null) {
                            setIsTabletRightPanelOpen(false);
                        }
                    }}
                    newLineupData={controller.newLineupData}
                    setNewLineupData={controller.setNewLineupData}
                    placingType={controller.placingType}
                    setPlacingType={controller.setPlacingType}
                    selectedAgent={controller.selectedAgent}
                    selectedAbilityIndex={controller.selectedAbilityIndex}
                    onViewLineup={(id) => {
                        controller.handleViewLineup(id);
                        if (isTabletLandscape) {
                            setIsTabletRightPanelOpen(false);
                        }
                    }}
                    isFlipped={controller.selectedSide === 'defense'}
                    sharedLineup={controller.selectedLineup}
                />

                {!isMobile && (
                    <>
                        <div className="absolute top-3 left-3 z-10 flex items-center gap-3">
                            {user && (
                                <LibrarySwitchButton
                                    currentLibrary="shared"
                                />
                            )}




                            <CompactUserCard
                                user={user}
                                onSignOut={onSignOut}
                                onRequestLogin={onRequestLogin}
                            />
                        </div>

                        <div className="absolute top-3 right-3 z-10">
                            <AuthorLinksBar />
                        </div>



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
                                saveProgress={controller.saveProgressAverage}
                            />
                        )}
                    </>
                )}

                {isMobile && (
                    <>
                        {/* 第一行：顶部 Tab 栏 */}
                        <div className="absolute top-0 left-0 right-0 z-20 h-14 bg-[#1a1a1a]/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4">
                            {/* 左侧：Logo */}
                            <a href="/" className="flex items-center gap-2">
                                <img src="/logo.svg" alt="ValPoint" className="w-6 h-6" />
                                <span className="text-white font-bold">ValPoint</span>
                            </a>
                            {/* 右侧：GitHub & Wiki */}
                            <div className="flex items-center gap-4">
                                {deployPlatform && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-gray-400 border border-white/5">
                                        {deployPlatform}
                                    </span>
                                )}
                                <a
                                    href="https://github.com/xiongaox/ValPoint"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-white transition-colors"
                                    title="GitHub"
                                >
                                    <Icon name="Github" size={20} />
                                </a>
                                <a
                                    href="/wiki/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-white transition-colors"
                                    title="Wiki 文档"
                                >
                                    <Icon name="BookOpen" size={20} />
                                </a>
                            </div>
                        </div>

                        {/* 第二行：个人库/共享库切换 */}
                        <div className="absolute top-16 left-3 z-10">
                            <div className="flex bg-black/60 backdrop-blur-sm rounded-xl border border-white/10 p-1.5">
                                <a
                                    href={personalLibraryUrl || '/'}
                                    className="px-4 h-[32px] flex items-center justify-center rounded-lg text-sm font-medium transition-all text-gray-400 hover:text-white"
                                >
                                    个人库
                                </a>

                                <div
                                    className={`px-4 h-[32px] flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${controller.currentSubscription.id === 'local' ? 'bg-[#17b890] text-white' : 'bg-[#ff4655] text-white'
                                        }`}
                                >
                                    共享库
                                </div>
                            </div>
                        </div>

                        <div className="absolute top-16 right-3 z-10 flex items-center gap-2">
                            {user ? (
                                <div className="flex bg-black/60 backdrop-blur-sm rounded-xl border border-white/10 p-1.5 items-center gap-2">
                                    <button
                                        onClick={() => setIsProfileModalOpen(true)}
                                        className="w-[32px] h-[32px] flex items-center justify-center rounded-lg overflow-hidden hover:bg-white/10 transition-colors"
                                        title="个人中心"
                                    >
                                        <UserAvatar email={user?.email || ''} size={32} bordered={false} avatarUrl={profile?.avatar} />
                                    </button>
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
                            <button
                                onClick={() => setIsMobileLineupListOpen(true)}
                                className="w-[46px] h-[46px] flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl border border-white/10"
                                title="点位列表"
                            >
                                <Icon name="List" size={20} className="text-white" />
                            </button>
                        </div>

                        <div className="absolute bottom-8 left-3 right-3 z-10 flex items-center justify-between gap-2">
                            <button
                                onClick={() => setIsMobileMapPickerOpen(true)}
                                className="flex items-center gap-2 px-3 h-[46px] bg-black/60 backdrop-blur-sm rounded-xl border border-white/10"
                            >
                                <Icon name="Map" size={18} className="text-[#ff4655]" />
                                <span className="text-white text-sm font-medium max-w-[70px] truncate">{controller.getMapDisplayName(controller.selectedMap?.displayName || '') || '地图'}</span>
                            </button>

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

                        {controller.selectedAgent && (
                            <div className="absolute top-32 right-3.5 z-10 flex flex-col gap-4">
                                {getAbilityList(controller.selectedAgent).map((ability: any, idx: number) => {
                                    const iconUrl = getAbilityIcon(controller.selectedAgent!, idx);
                                    const isDisabled = disabledAbilities.has(idx);
                                    const isSelected = !isDisabled; // 说明：选中表示未禁用。
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

                {/* ICP 备案信息（仅桌面端，通过环境变量配置） */}
                {!isMobile && <ICPFooter />}

                {isTabletLandscape && (
                    <>
                        {isTabletRightPanelOpen && (
                            <button
                                onClick={() => setIsTabletRightPanelOpen(false)}
                                className="absolute inset-0 z-30 bg-black/35"
                                aria-label="关闭点位抽屉"
                            />
                        )}
                        <button
                            onClick={() => setIsTabletRightPanelOpen((v) => !v)}
                            className="absolute top-1/2 -translate-y-1/2 tablet-fab-safe z-50 h-12 w-12 rounded-xl border border-white/15 bg-black/60 backdrop-blur-sm flex items-center justify-center hover:border-[#ff4655]/70 transition-colors"
                            title={isTabletRightPanelOpen ? '收起点位列表' : '展开点位列表'}
                        >
                            <Icon name={isTabletRightPanelOpen ? 'ChevronRight' : 'ChevronLeft'} size={20} className="text-white" />
                        </button>
                        <div className={`tablet-drawer-panel absolute top-0 right-0 bottom-0 z-40 transition-transform duration-300 ease-out ${isTabletRightPanelOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}>
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
                                handleViewLineup={(id) => {
                                    controller.handleViewLineup(id);
                                    setIsTabletRightPanelOpen(false);
                                }}
                                handleDownload={controller.handleDownload}
                                getMapDisplayName={controller.getMapDisplayName}
                                onOpenFilter={() => controller.setIsFilterModalOpen(true)}
                                userId={user?.id}
                                submissionEnabled={submissionEnabled}
                                layoutMode="tablet-drawer"
                            />
                        </div>
                    </>
                )}
            </div>

            {isDesktop && (
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

            <MapPickerModal
                isOpen={controller.isMapModalOpen}
                maps={controller.maps}
                selectedMap={controller.selectedMap}
                setSelectedMap={controller.setSelectedMap}
                setIsMapModalOpen={controller.setIsMapModalOpen}
                getMapDisplayName={controller.getMapDisplayName}
            />

            <MobileAgentPicker
                isOpen={isMobileAgentPickerOpen}
                onClose={() => setIsMobileAgentPickerOpen(false)}
                agents={controller.agents}
                selectedAgent={controller.selectedAgent}
                onSelect={controller.setSelectedAgent}
                agentCounts={controller.agentCounts}
            />

            <MobileMapPicker
                isOpen={isMobileMapPickerOpen}
                onClose={() => setIsMobileMapPickerOpen(false)}
                maps={controller.maps}
                selectedMap={controller.selectedMap}
                onSelect={controller.setSelectedMap}
            />

            <MobileLineupList
                isOpen={isMobileLineupListOpen}
                onClose={() => setIsMobileLineupListOpen(false)}
                lineups={mobileFilteredLineups}
                selectedLineupId={controller.selectedLineupId}
                onSelectLineup={controller.setSelectedLineupId}
                isLoading={controller.isLoading}
            />

            <ViewerModal
                viewingLineup={controller.viewingLineup}
                onClose={controller.handleViewerClose}
                handleEditStart={() => { }}
                setViewingImage={setViewingImage}
                getMapDisplayName={controller.getMapDisplayName}
                getMapEnglishName={controller.getMapEnglishName}
                isGuest={!user}
                handleSaveToPersonal={controller.handleSaveToPersonal}
                isSavingToPersonal={controller.viewingLineup ? controller.savingLineupIds.has(controller.viewingLineup.id) : false}
                handleCopyShared={(lineup: any) => {
                    if (lineup) controller.handleDownload(lineup.id);
                }}
                isSavingShared={controller.isDownloading}
            />

            <SharedFilterModal
                isOpen={controller.isFilterModalOpen}
                contributors={controller.contributors}
                selectedUserId={controller.selectedSharedUserId}
                onSelect={controller.setSelectedSharedUserId}
                onClose={() => controller.setIsFilterModalOpen(false)}
            />

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

            <UserProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                setAlertMessage={setAlertMessage}
            />

            <ChangelogModal
                isOpen={isChangelogOpen}
                onClose={() => setIsChangelogOpen(false)}
            />



            <AlertModal
                title="需配置图床"
                message={controller.isConfigConfirmOpen ? '为了保证数据的长期可用性，保存点位前必须配置个人图床。\n\n系统不再支持直接引用原作者的图片链接。\n请先完成配置。' : null}
                variant="default"
                actionLabel="去配置"
                onAction={() => {
                    const currentUrl = new URL(window.location.href);
                    // 强制确保 URL 包含当前选中的点位 ID
                    if (controller.selectedLineupId || controller.viewingLineup?.id) {
                        const targetId = controller.selectedLineupId || controller.viewingLineup?.id;
                        if (targetId) currentUrl.searchParams.set('lineup', targetId);
                    }
                    const returnUrl = encodeURIComponent(currentUrl.toString());
                    window.location.href = `/user.html?open=image_config&return_to=${returnUrl}`;
                }}
                secondaryLabel="取消"
                onSecondary={controller.handleCancelSave}
                onClose={controller.handleCancelSave}
            />
        </div>
    );
}

export default SharedMainView;
