/**
 * 审核用地图预览组件
 * 使用 img 标签显示地图，标记叠加在上面
 */
import React, { useState, useCallback, useRef } from 'react';
import Icon from '../../../components/Icon';
import { LineupSubmission } from '../../../types/submission';
import { CUSTOM_MAP_URLS } from '../../../constants/maps';

interface ReviewMapProps {
    submission: LineupSubmission | null;
}

function ReviewMapPreview({ submission }: ReviewMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // 获取地图 SVG URL
    const mapSvgUrl = submission
        ? CUSTOM_MAP_URLS[submission.map_name as keyof typeof CUSTOM_MAP_URLS]?.[
        submission.side === 'defense' ? 'defense' : 'attack'
        ]
        : null;

    // 选中新投稿时重置视图
    React.useEffect(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }, [submission?.id]);

    // 滚轮缩放
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setScale((prev) => Math.min(Math.max(prev + delta, 0.5), 3));
    }, []);

    // 开始拖拽
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }, [position]);

    // 拖拽中
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging) return;
        setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }, [isDragging, dragStart]);

    // 结束拖拽
    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // 重置视图
    const handleReset = useCallback(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }, []);

    if (!submission || !mapSvgUrl) {
        return (
            <div className="flex-1 bg-[#1f2326] rounded-xl border border-white/10 flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10">
                    <h3 className="font-semibold">地图预览</h3>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                    <Icon name="Map" size={48} className="mb-2 opacity-20" />
                    <span className="text-sm">选择一个点位查看地图</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-[#1f2326] rounded-xl border border-white/10 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-semibold">地图预览</h3>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                        {submission.map_name} · {submission.side === 'attack' ? '进攻方' : '防守方'}
                    </span>
                    <button
                        onClick={handleReset}
                        className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
                        title="重置视图"
                    >
                        重置
                    </button>
                    <span className="text-xs text-gray-500">{Math.round(scale * 100)}%</span>
                </div>
            </div>
            <div
                ref={containerRef}
                className="flex-1 relative overflow-hidden bg-[#0f1923] cursor-grab active:cursor-grabbing"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        transformOrigin: 'center center',
                    }}
                >
                    {/* 地图和标记容器 */}
                    <div className="relative" style={{ width: '600px', height: '600px' }}>
                        {/* 地图图片 */}
                        <img
                            src={mapSvgUrl}
                            alt={submission.map_name}
                            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                            draggable={false}
                        />
                        {/* 站位点标记 */}
                        {submission.agent_pos && (
                            <div
                                className="absolute rounded-full border-white shadow-lg overflow-hidden"
                                style={{
                                    width: `${32 / scale}px`,
                                    height: `${32 / scale}px`,
                                    borderWidth: `${3 / scale}px`,
                                    borderStyle: 'solid',
                                    left: `${(submission.agent_pos.lng / 1000) * 100}%`,
                                    top: `${((1000 - submission.agent_pos.lat) / 1000) * 100}%`,
                                    transform: 'translate(-50%, -50%)',
                                }}
                                title="站位点"
                            >
                                {submission.agent_icon ? (
                                    <img src={submission.agent_icon} alt="agent" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-[#ff4655] flex items-center justify-center text-white font-bold" style={{ fontSize: `${12 / scale}px` }}>
                                        A
                                    </div>
                                )}
                            </div>
                        )}
                        {/* 落点标记 */}
                        {submission.skill_pos && (
                            <div
                                className="absolute rounded-full border-white shadow-lg overflow-hidden"
                                style={{
                                    width: `${28 / scale}px`,
                                    height: `${28 / scale}px`,
                                    borderWidth: `${2 / scale}px`,
                                    borderStyle: 'solid',
                                    left: `${(submission.skill_pos.lng / 1000) * 100}%`,
                                    top: `${((1000 - submission.skill_pos.lat) / 1000) * 100}%`,
                                    transform: 'translate(-50%, -50%)',
                                }}
                                title="落点"
                            >
                                {submission.skill_icon ? (
                                    <img src={submission.skill_icon} alt="skill" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-emerald-500 flex items-center justify-center text-white font-bold" style={{ fontSize: `${10 / scale}px` }}>
                                        S
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ReviewMapPreview;
