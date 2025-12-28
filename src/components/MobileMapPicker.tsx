/**
 * MobileMapPicker - 移动端地图选择弹窗
 * 
 * 以底部抽屉形式展示地图列表供用户选择
 * 显示地图封面图，中文大标题+英文小标题
 */
import React from 'react';
import Icon from './Icon';
import { MapOption } from '../types/lineup';
import { MAP_TRANSLATIONS } from '../constants/maps';

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
    if (!isOpen) return null;

    const handleSelect = (map: MapOption) => {
        onSelect(map);
        onClose();
    };

    // 将中文名转为英文 ID
    const getMapEnglishId = (displayName: string): string => {
        const entry = Object.entries(MAP_TRANSLATIONS).find(([, zh]) => zh === displayName);
        return entry ? entry[0] : displayName;
    };

    return (
        <>
            {/* 背景遮罩 */}
            <div
                className="fixed inset-0 bg-black/60 z-[1000] animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* 底部抽屉 */}
            <div className="fixed bottom-0 left-0 right-0 z-[1001] bg-[#1f2326] rounded-t-2xl animate-in slide-in-from-bottom duration-300 max-h-[70vh] flex flex-col">
                {/* 头部 */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <h3 className="text-white font-semibold">选择地图</h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white"
                    >
                        <Icon name="X" size={20} />
                    </button>
                </div>

                {/* 地图列表 */}
                <div className="flex-1 overflow-y-auto p-3">
                    <div className="grid grid-cols-2 gap-3">
                        {maps.map((map) => {
                            const isSelected = selectedMap?.displayName === map.displayName;
                            // map.displayName 是英文名（如 Ascent），获取中文名
                            const mapEnglishName = map.displayName;
                            const mapChineseName = MAP_TRANSLATIONS[mapEnglishName] || mapEnglishName;
                            // 使用中文名获取封面图
                            const coverUrl = `/maps/covers/${mapChineseName}.webp`;

                            return (
                                <button
                                    key={map.displayName}
                                    onClick={() => handleSelect(map)}
                                    className={`relative overflow-hidden rounded-xl transition-all ${isSelected
                                        ? 'ring-2 ring-[#ff4655]'
                                        : 'ring-1 ring-white/10 hover:ring-white/30'
                                        }`}
                                >
                                    {/* 地图封面 */}
                                    <div className="aspect-[16/10] relative">
                                        <img
                                            src={coverUrl}
                                            alt={mapChineseName}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                // 封面加载失败时使用displayIcon
                                                (e.target as HTMLImageElement).src = map.displayIcon || '';
                                            }}
                                        />
                                        {/* 渐变遮罩 */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                        {/* 选中标记 */}
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 w-6 h-6 bg-[#ff4655] rounded-full flex items-center justify-center">
                                                <Icon name="Check" size={14} className="text-white" />
                                            </div>
                                        )}

                                        {/* 地图名称 - 仅中文 */}
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
