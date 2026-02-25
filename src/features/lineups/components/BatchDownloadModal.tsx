/**
 * BatchDownloadModal - Feature 组件层
 *
 * 模块定位：
 * - 所在层级：Feature 组件层
 * - 主要目标：承载点位模块内聚 UI
 *
 * 关键职责：
 * - 聚焦界面渲染与交互事件回调
 * - 接收上层 props 并输出稳定 UI 行为
 * - 避免在组件中堆积跨模块业务逻辑
 *
 * 主要导出：
 * - `default:BatchDownloadModal`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`react-dom`、`../../../components/Icon`、`../../../constants/maps`
 * - 下游影响：供 MainView 与控制器配合
 */

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import Icon from '../../../components/Icon';
import { MAP_TRANSLATIONS } from '../../../constants/maps';
import { useEscapeClose } from '../../../hooks/useEscapeClose';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    currentMapName?: string;
    currentMapIcon?: string | null;
    currentAgentName?: string;
    currentAgentIcon?: string | null;
    totalAgentLineups: number;
    totalMapLineups: number;
    onDownload: (scope: 'agent' | 'map') => Promise<void>;
}

const BatchDownloadModal: React.FC<Props> = ({
    isOpen,
    onClose,
    currentMapName,
    currentMapIcon,
    currentAgentName,
    currentAgentIcon,
    totalAgentLineups,
    totalMapLineups,
    onDownload,
}) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const handleClose = () => {
        if (isDownloading) return;
        onClose();
    };

    useEscapeClose(isOpen, handleClose);

    if (!isOpen) return null;

    const handleDownloadClick = async (scope: 'agent' | 'map') => {
        setIsDownloading(true);
        try {
            await onDownload(scope);
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setIsDownloading(false);
        }
    };

    const mapNameDisplay = currentMapName ? (MAP_TRANSLATIONS[currentMapName] || currentMapName) : '未选择';

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[1500] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
             transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
            <div className="w-[400px] max-w-lg rounded-2xl border border-white/10 bg-[#181b1f]/95 shadow-2xl shadow-black/50 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#1c2028]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#ff4655]/15 border border-[#ff4655]/35 flex items-center justify-center text-[#ff4655]">
                            <Icon name="Download" size={18} />
                        </div>
                        <div className="leading-tight">
                            <div className="text-xl font-bold text-white">批量下载点位</div>
                            <div className="text-xs text-gray-500">导出 ZIP 压缩包</div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isDownloading}
                        className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
                    >
                        <Icon name="X" size={16} />
                    </button>
                </div>

                <div className="p-5 bg-[#181b1f]">
                    {isDownloading ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ff4655]/10 border border-[#ff4655]/30 flex items-center justify-center">
                                <Icon name="Loader" size={32} className="text-[#ff4655] animate-spin" />
                            </div>
                            <p className="text-white font-semibold mb-2">正在根据浏览器机制下载...</p>
                            <p className="text-gray-400 text-sm">请允许浏览器即使下载多个文件</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleDownloadClick('map')}
                                disabled={!currentMapName || totalMapLineups === 0}
                                className="group rounded-2xl p-3 flex flex-col items-center gap-2 transition-colors border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#ff4655]/50"
                            >
                                <div className="w-14 h-14 rounded-full border-2 border-[#ff4655]/50 overflow-hidden bg-[#1f2326] group-hover:border-[#ff4655]/70 transition-colors flex items-center justify-center">
                                    {currentMapIcon ? (
                                        <img src={currentMapIcon} alt={currentMapName} className="w-full h-full object-cover" />
                                    ) : (
                                        <Icon name="Map" size={24} className="text-gray-400" />
                                    )}
                                </div>
                                <div className="text-white font-semibold text-sm">当前地图</div>
                                <div className="text-xs text-gray-400">{mapNameDisplay}</div>
                                <div className="text-xs font-semibold text-[#ff4655]">{totalMapLineups} 个点位</div>
                            </button>

                            <button
                                onClick={() => handleDownloadClick('agent')}
                                disabled={!currentAgentName || totalAgentLineups === 0}
                                className="group rounded-2xl p-3 flex flex-col items-center gap-2 transition-colors border border-amber-400/40 bg-amber-500/10 hover:bg-amber-500/15 disabled:opacity-50 disabled:cursor-not-allowed hover:border-amber-400/70"
                            >
                                <div className="w-14 h-14 rounded-full border-2 border-amber-500/50 overflow-hidden bg-[#1f2326] group-hover:border-amber-500/70 transition-colors flex items-center justify-center">
                                    {currentAgentIcon ? (
                                        <img src={currentAgentIcon} alt={currentAgentName} className="w-full h-full object-cover" />
                                    ) : (
                                        <Icon name="User" size={24} className="text-gray-400" />
                                    )}
                                </div>
                                <div className="text-white font-semibold text-sm">当前特工</div>
                                <div className="text-xs text-amber-200/80">{currentAgentName || '未选择'}</div>
                                <div className="text-xs font-semibold text-amber-400">{totalAgentLineups} 个点位</div>
                            </button>
                        </div>
                    )}
                </div>

                {!isDownloading && (
                    <div className="px-5 py-4 border-t border-white/10 bg-[#1c2028] flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                            点击卡片即可开始下载
                        </div>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-white/15 text-sm text-gray-200 hover:border-white/40 hover:bg-white/5 transition-colors"
                        >
                            取消
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default BatchDownloadModal;
