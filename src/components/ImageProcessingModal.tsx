import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import { ImageProcessingSettings } from '../types/imageProcessing';

type Props = {
    isOpen: boolean;
    settings: ImageProcessingSettings;
    onClose: () => void;
    onSave: (settings: ImageProcessingSettings) => void;
};

const clampQuality = (val: number) => Math.min(1, Math.max(0.1, val));

const ImageProcessingModal: React.FC<Props> = ({ isOpen, settings, onClose, onSave }) => {
    const [localSettings, setLocalSettings] = useState<ImageProcessingSettings>(settings);

    useEffect(() => {
        if (isOpen) {
            setLocalSettings(settings);
        }
    }, [isOpen, settings]);

    if (!isOpen) return null;

    const handleQualityChange = (val: number) => {
        setLocalSettings((prev) => ({ ...prev, jpegQuality: clampQuality(val) }));
    };

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[1200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#181b1f]/95 shadow-2xl shadow-black/50 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#1c2028]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#ff4655]/15 border border-[#ff4655]/35 flex items-center justify-center text-[#ff4655]">
                            <Icon name="Image" size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">图片处理 (PNG 转换)</h3>
                            <p className="text-xs text-gray-500 mt-0.5">配置剪贴板图片的自动转换与压缩策略</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors"
                    >
                        <Icon name="X" size={18} />
                    </button>
                </div>

                <div className="p-5 space-y-5 bg-[#181b1f]">
                    <div className="bg-[#13161a] border border-white/10 rounded-xl p-5 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                    <Icon name="RefreshCw" size={16} className="text-[#ff4655]" />
                                    <div className="text-sm font-bold text-white">开启 PNG 自动转换</div>
                                </div>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    将剪贴板粘贴的 PNG 图片转换为更高效的格式（JPG/WebP），大幅减少体积并加快上传速度。
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <button
                                    onClick={() => setLocalSettings((prev) => ({ ...prev, enablePngConversion: !prev.enablePngConversion }))}
                                    className={`relative w-12 h-7 rounded-full border transition-colors flex items-center px-1 flex-shrink-0 ${localSettings.enablePngConversion ? 'bg-[#ff4655] border-[#ff7884]' : 'bg-[#1c2430] border-white/10'
                                        }`}
                                >
                                    <div
                                        className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-150 ${localSettings.enablePngConversion ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>

                        {localSettings.enablePngConversion && (
                            <div className="pt-4 border-t border-white/10 space-y-4 animate-in fade-in">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-semibold text-white">目标格式</div>
                                        <p className="text-xs text-gray-400 mt-0.5">推荐使用 JPG 以获得最佳兼容性</p>
                                    </div>
                                    <div className="flex items-center bg-[#0f131a] p-1 rounded-lg border border-white/10">
                                        <button
                                            onClick={() => setLocalSettings((prev) => ({ ...prev, pngConvertFormat: 'jpeg' }))}
                                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${localSettings.pngConvertFormat === 'jpeg'
                                                ? 'bg-[#ff4655] text-white shadow-md'
                                                : 'text-gray-400 hover:text-white'
                                                }`}
                                        >
                                            JPG
                                        </button>
                                        <button
                                            onClick={() => setLocalSettings((prev) => ({ ...prev, pngConvertFormat: 'webp' }))}
                                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${localSettings.pngConvertFormat === 'webp'
                                                ? 'bg-[#ff4655] text-white shadow-md'
                                                : 'text-gray-400 hover:text-white'
                                                }`}
                                        >
                                            WebP
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-semibold text-white">压缩质量: {Math.round(localSettings.jpegQuality * 100)}%</div>
                                            <p className="text-xs text-gray-400 mt-0.5">值越低体积越小，但在高分辨率下可能会模糊</p>
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min={0.1}
                                        max={1}
                                        step={0.01}
                                        value={localSettings.jpegQuality}
                                        onChange={(e) => handleQualityChange(Number(e.target.value))}
                                        className="w-full accent-[#ff4655] h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                                        <span>低质量 (0.1)</span>
                                        <span>平衡 (0.6)</span>
                                        <span>原画 (1.0)</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm font-semibold text-gray-200 hover:border-white/30 hover:text-white transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#ff5b6b] to-[#ff3c4d] hover:from-[#ff6c7b] hover:to-[#ff4c5e] shadow-lg shadow-red-900/30 transition-all cursor-pointer"
                        >
                            保存配置
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageProcessingModal;
