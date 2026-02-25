/**
 * ReviewMapPreview - 应用壳层(admin)
 *
 * 模块定位：
 * - 所在层级：应用壳层(admin)
 * - 主要目标：承载管理后台流程与页面路由
 *
 * 关键职责：
 * - 聚焦界面渲染与交互事件回调
 * - 接收上层 props 并输出稳定 UI 行为
 * - 避免在组件中堆积跨模块业务逻辑
 *
 * 主要导出：
 * - `default:ReviewMapPreview`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`../../../components/Icon`、`../../../types/submission`、`../../../constants/maps`
 * - 下游影响：供 admin.html 入口挂载
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Icon from '../../../components/Icon';
import { LineupSubmission } from '../../../types/submission';
import { CUSTOM_MAP_URLS, MAP_TRANSLATIONS } from '../../../constants/maps';
import { LOCAL_MAPS } from '../../../data/localMaps';

interface ReviewMapProps {
    submission: LineupSubmission | null;
}

function ReviewMapPreview({ submission }: ReviewMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const mapSvgUrl = submission
        ? CUSTOM_MAP_URLS[submission.map_name as keyof typeof CUSTOM_MAP_URLS]?.[
        submission.side === 'defense' ? 'defense' : 'attack'
        ]
        : null;

    const mapCoverUrl = useMemo(() => {
        if (!submission) return null;
        const mapData = LOCAL_MAPS.find((m: any) => m.displayName === submission.map_name);
        if (mapData) return mapData.displayIcon;
        const englishName = Object.keys(MAP_TRANSLATIONS).find(
            key => MAP_TRANSLATIONS[key] === submission.map_name
        );
        if (englishName) {
            const map = LOCAL_MAPS.find((m: any) => m.displayName === englishName);
            return map?.displayIcon || null;
        }
        return null;
    }, [submission?.map_name]);

    React.useEffect(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }, [submission?.id]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY > 0 ? -0.15 : 0.15;
        setScale((prev) => Math.min(Math.max(prev + delta, 0.5), 3));
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }, [position]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging) return;
        setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }, [isDragging, dragStart]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

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
        <div className="flex-1 bg-[#1f2326] rounded-xl border border-white/10 flex flex-col overflow-hidden relative">
            <div
                ref={containerRef}
                className="flex-1 relative overflow-hidden bg-[#0f1923] cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
            >
                {mapCoverUrl && (
                    <div
                        className="absolute inset-0 pointer-events-none opacity-15"
                        style={{ backgroundImage: `url(${mapCoverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                    />
                )}
                <div className="absolute top-0 left-0 right-0 px-4 py-3 flex items-center justify-between bg-black/20 backdrop-blur-lg border-b border-white/10 z-10">
                    <h3 className="font-semibold">地图预览</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                            {MAP_TRANSLATIONS[submission.map_name] || submission.map_name} · {submission.side === 'attack' ? '进攻方' : '防守方'}
                        </span>
                        <button
                            onClick={handleReset}
                            className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
                            title="重置视图"
                        >
                            重置
                        </button>
                    </div>
                </div>
                <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        transformOrigin: 'center center',
                    }}
                >
                    <div className="relative" style={{ width: '600px', height: '600px' }}>
                        <img
                            src={mapSvgUrl}
                            alt={submission.map_name}
                            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                            draggable={false}
                        />
                        {submission.agent_pos && (() => {
                            const isDefense = submission.side === 'defense';
                            const lat = isDefense ? 1000 - submission.agent_pos.lat : submission.agent_pos.lat;
                            const lng = isDefense ? 1000 - submission.agent_pos.lng : submission.agent_pos.lng;
                            return (
                                <div
                                    className="absolute rounded-full border-white shadow-lg overflow-hidden bg-[#1f2326]"
                                    style={{
                                        width: `${32 / scale}px`,
                                        height: `${32 / scale}px`,
                                        borderWidth: `${3 / scale}px`,
                                        borderStyle: 'solid',
                                        left: `${(lng / 1000) * 100}%`,
                                        top: `${((1000 - lat) / 1000) * 100}%`,
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
                            );
                        })()}
                        {submission.skill_pos && (() => {
                            const isDefense = submission.side === 'defense';
                            const lat = isDefense ? 1000 - submission.skill_pos.lat : submission.skill_pos.lat;
                            const lng = isDefense ? 1000 - submission.skill_pos.lng : submission.skill_pos.lng;
                            return (
                                <div
                                    className="absolute rounded-full border-white shadow-lg overflow-hidden bg-[#1f2326]"
                                    style={{
                                        width: `${28 / scale}px`,
                                        height: `${28 / scale}px`,
                                        borderWidth: `${2 / scale}px`,
                                        borderStyle: 'solid',
                                        left: `${(lng / 1000) * 100}%`,
                                        top: `${((1000 - lat) / 1000) * 100}%`,
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
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ReviewMapPreview;
