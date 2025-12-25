/**
 * 待审点位右侧抽屉
 * 类似 EditorModal 的右侧抽屉，内容复用 PendingSubmissionsTab
 */
import React from 'react';
import Icon from '../../components/Icon';
import PendingSubmissionsTab from '../shared/PendingSubmissionsTab';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    userId: string | null;
}

const PendingSubmissionsDrawer: React.FC<Props> = ({ isOpen, onClose, userId }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1200] pointer-events-none flex justify-end">
            <div className="pointer-events-auto h-full w-[383px] max-w-[383px] min-w-[383px] bg-[#10151b]/95 backdrop-blur-md border-l border-[#1b1f2a] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 p-5 border-b border-[#1b1f2a] bg-[#1f2326]/90">
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Icon name="Clock" className="text-amber-400" /> 我的投稿
                        </h2>
                        <p className="text-xs text-gray-500">查看已提交的点位审核状态</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg border border-[#1b1f2a] text-gray-400 hover:text-white hover:border-[#ff4655]/50 transition-colors"
                    >
                        <Icon name="X" size={18} />
                    </button>
                </div>

                {/* Content - 复用 PendingSubmissionsTab */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    <PendingSubmissionsTab userId={userId} />
                </div>
            </div>
        </div>
    );
};

export default PendingSubmissionsDrawer;
