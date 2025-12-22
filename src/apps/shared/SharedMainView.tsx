import React from 'react';
import { User } from '@supabase/supabase-js';
import LeafletMap from '../../components/LeafletMap';
import LeftPanel from '../../components/LeftPanel';
import SharedRightPanel from './SharedRightPanel';
import MapPickerModal from '../../components/MapPickerModal';
import Icon from '../../components/Icon';
import { useSharedController } from './useSharedController';

interface SharedMainViewProps {
    user: User | null; // 可选，未登录也可以浏览
    onSignOut: () => void;
    setAlertMessage: (msg: string | null) => void;
    setViewingImage: (img: { src: string; list?: string[]; index?: number } | null) => void;
    onRequestLogin: () => void; // 下载时请求登录
}

/**
 * 共享库主视图
 * 开放浏览模式 - 未登录可以浏览，下载需要登录
 */
function SharedMainView({ user, onSignOut, setAlertMessage, setViewingImage, onRequestLogin }: SharedMainViewProps) {
    const controller = useSharedController({ user, setAlertMessage, setViewingImage, onRequestLogin });

    return (
        <div className="flex h-screen w-screen bg-[#0f1923] text-white overflow-hidden">
            {/* 左侧面板 - 地图和特工选择 */}
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
                openChangelog={() => { }}
            />

            {/* 中间地图区域 */}
            <div className="flex-1 relative bg-[#0f1923] z-0 border-l border-r border-white/10">
                <LeafletMap
                    mapIcon={controller.mapIcon}
                    mapCover={controller.mapCover}
                    activeTab="view"
                    lineups={controller.filteredLineups}
                    selectedLineupId={controller.selectedLineupId}
                    onLineupSelect={controller.setSelectedLineupId}
                    newLineupData={controller.newLineupData}
                    setNewLineupData={controller.setNewLineupData}
                    placingType={controller.placingType}
                    setPlacingType={controller.setPlacingType}
                    selectedAgent={controller.selectedAgent}
                    selectedAbilityIndex={controller.selectedAbilityIndex}
                    onViewLineup={controller.handleViewLineup}
                    isFlipped={false}
                    sharedLineup={controller.selectedLineup}
                />

                {/* 用户状态显示 */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-[#1f2326]/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10">
                    <div className="w-8 h-8 bg-[#ff4655]/20 rounded-full flex items-center justify-center">
                        <Icon name="User" size={16} className="text-[#ff4655]" />
                    </div>
                    {user ? (
                        <>
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400">已登录</span>
                                <span className="text-sm text-white font-medium truncate max-w-[150px]">
                                    {user.email}
                                </span>
                            </div>
                            <button
                                onClick={onSignOut}
                                className="ml-2 p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                                title="退出登录"
                            >
                                <Icon name="LogOut" size={16} />
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400">游客模式</span>
                                <span className="text-sm text-white font-medium">未登录</span>
                            </div>
                            <button
                                onClick={onRequestLogin}
                                className="ml-2 px-3 py-1.5 text-sm bg-[#ff4655] hover:bg-[#ff5a67] text-white rounded transition-colors"
                            >
                                登录
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* 右侧面板 - 与个人库共享模式一致 */}
            <SharedRightPanel
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
            />

            {/* 地图选择弹窗 */}
            <MapPickerModal
                isOpen={controller.isMapModalOpen}
                maps={controller.maps}
                selectedMap={controller.selectedMap}
                setSelectedMap={controller.setSelectedMap}
                setIsMapModalOpen={controller.setIsMapModalOpen}
                getMapDisplayName={controller.getMapDisplayName}
            />
        </div>
    );
}

export default SharedMainView;
