/**
 * MobileMapPicker - 移动端地图选择器
 *
 * 职责：
 * - 渲染移动端地图选择器相关的界面结构与样式。
 * - 处理用户交互与状态变更并触发回调。
 * - 组合子组件并提供可配置项。
 */

import React from 'react';
import Icon from './Icon';
import { MapOption } from '../types/lineup';
import { translateMapName, mapNameToEnglish, POOL_STATUS_CONFIG } from '../constants/maps';
import { useEscapeClose } from '../hooks/useEscapeClose';

interface MobileMapPickerProps {
    isOpen: boolean;
    onClose: () => void;
    maps: MapOption[];
    selectedMap: MapOption | null;
    onSelect: (map: MapOption) => void;
}

function MobileMapPicker({
    isOpen,
    onClose,
    maps,
    selectedMap,
    onSelect,
}: MobileMapPickerProps) {
    useEscapeClose(isOpen, onClose);

    if (!isOpen) return null;

    const handleSelect = (map: MapOption) => {
        onSelect(map);
        onClose();
    };

    const getMapEnglishId = (displayName: string): string => mapNameToEnglish(displayName);

    return (
        <>
            <div
                className="fixed inset-0 bg-black/60 z-[1000] animate-in fade-in duration-200"
                onClick={onClose}
            />

            <div className="fixed bottom-0 left-0 right-0 z-[1001] bg-[#1f2326] rounded-t-2xl animate-in slide-in-from-bottom duration-300 max-h-[70vh] flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <h3 className="text-white font-semibold">选择地图</h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white"
                    >
                        <Icon name="X" size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3">
                    <div className="grid grid-cols-2 gap-3">
                        {maps.map((map) => {
                            const isSelected = selectedMap?.displayName === map.displayName;
                            const mapEnglishName = map.displayName;
                            const mapChineseName = translateMapName(mapEnglishName);
                            const coverUrl = `/maps/covers/${mapChineseName}.webp`;
                            const statusConfig = map.poolStatus ? POOL_STATUS_CONFIG[map.poolStatus] : null;

                            return (
                                <button
                                    key={map.displayName}
                                    onClick={() => handleSelect(map)}
                                    className={`relative overflow-hidden rounded-xl transition-all ${isSelected
                                        ? 'ring-2 ring-[#ff4655]'
                                        : 'ring-1 ring-white/10 hover:ring-white/30'
                                        }`}
                                >
                                    <div className="aspect-[16/10] relative">
                                        <img
                                            src={coverUrl}
                                            alt={mapChineseName}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = map.displayIcon || '';
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                        {isSelected && (
                                            <div className="absolute top-2 right-2 w-6 h-6 bg-[#ff4655] rounded-full flex items-center justify-center">
                                                <Icon name="Check" size={14} className="text-white" />
                                            </div>
                                        )}

                                        {/* 排位池状态角标 */}
                                        {statusConfig && (
                                            <div
                                                className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-semibold text-white shadow-md ${statusConfig.className}`}
                                            >
                                                {statusConfig.label}
                                            </div>
                                        )}

                                        <div className="absolute bottom-0 left-0 right-0 p-3">
                                            <div className="text-white font-bold text-xl leading-tight">
                                                {mapChineseName}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}

export default MobileMapPicker;
