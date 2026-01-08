/**
 * ImageBedConfigForm - ImageBed配置表单
 *
 * 职责：
 * - 渲染ImageBed配置表单表单字段与验证提示。
 * - 管理表单状态并组装提交数据。
 * - 处理提交、重置或取消等交互。
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon';
import { ImageBedConfig, ImageBedProvider } from '../types/imageBed';
import {
    defaultImageBedConfig,
    imageBedProviderDefinitions,
    imageBedProviderMap,
    ImageBedField,
} from '../lib/imageBed';

export const normalizeConfig = (incoming?: ImageBedConfig): ImageBedConfig => {
    const providerCandidate = incoming?.provider;
    const provider = providerCandidate && imageBedProviderMap[providerCandidate] ? providerCandidate : defaultImageBedConfig.provider;
    const base = imageBedProviderMap[provider]?.defaultConfig || defaultImageBedConfig;
    const merged: ImageBedConfig = {
        ...base,
        ...incoming,
        _configName: incoming?._configName || (incoming as { name?: string })?.name || base._configName,
        provider,
    };
    if (provider === 'aliyun') {
        if (!merged.area && merged.region) merged.area = merged.region;
        if (merged.area && !merged.region) merged.region = merged.area;
        if (merged.path && !merged.basePath) merged.basePath = merged.path;
        if (merged.customUrl && !merged.customDomain) merged.customDomain = merged.customUrl;
    }
    return merged;
};

export interface ImageBedConfigFormProps {
    config: ImageBedConfig;
    onChange: (config: ImageBedConfig) => void;
    showProviderSwitch?: boolean;
    showCopyImport?: boolean;
    showReset?: boolean;
    onValidChange?: (isValid: boolean) => void;
    layout?: 'compact' | 'full';
}

const ImageBedConfigForm: React.FC<ImageBedConfigFormProps> = ({
    config,
    onChange,
    showProviderSwitch = true,
    showCopyImport = true,
    showReset = true,
    onValidChange,
    layout = 'full',
}) => {
    const [localConfig, setLocalConfig] = useState<ImageBedConfig>(normalizeConfig(config));
    const [isCopied, setIsCopied] = useState(false);
    const [showProviderMenu, setShowProviderMenu] = useState(false);

    useEffect(() => {
        setLocalConfig(normalizeConfig(config));
    }, [config]);

    const currentDefinition = useMemo(
        () => imageBedProviderMap[localConfig.provider] || imageBedProviderDefinitions[0],
        [localConfig.provider],
    );

    const isConfigValid = useMemo(() => {
        if (!localConfig.provider) return false;
        const definition = imageBedProviderMap[localConfig.provider];
        if (!definition) return false;
        return definition.fields
            .filter((f) => f.required)
            .every((f) => {
                const val = localConfig[f.key];
                return val !== undefined && val !== '';
            });
    }, [localConfig]);

    useEffect(() => {
        onValidChange?.(isConfigValid);
    }, [isConfigValid, onValidChange]);

    const updateField = (key: keyof ImageBedConfig, value: string | boolean) => {
        setLocalConfig((prev) => {
            const next: ImageBedConfig = { ...prev, [key]: value };
            if (prev.provider === 'aliyun') {
                if (key === 'area') next.region = typeof value === 'string' ? value : '';
                if (key === 'path') next.basePath = typeof value === 'string' ? value : '';
                if (key === 'customUrl') next.customDomain = typeof value === 'string' ? value : '';
            }
            onChange(next);
            return next;
        });
    };

    const handleCopy = async () => {
        try {
            const cleanConfig: Record<string, string | boolean> = {
                provider: localConfig.provider,
                _configName: localConfig._configName,
            };
            currentDefinition.fields.forEach((field) => {
                const value = localConfig[field.key];
                if (value !== undefined && value !== '') {
                    cleanConfig[field.key as string] = value;
                }
            });
            await navigator.clipboard.writeText(JSON.stringify(cleanConfig, null, 2));
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (e) {
            console.error(e);
            alert('复制失败，请手动复制。');
        }
    };

    const handleImport = async () => {
        const text = prompt('粘贴配置 JSON？');
        if (!text) return;
        try {
            const parsed = JSON.parse(text);
            const normalized = normalizeConfig(parsed);
            setLocalConfig(normalized);
            onChange(normalized);
        } catch (e) {
            alert('解析失败，请确认格式正确。');
        }
    };

    const handleReset = () => {
        const base = imageBedProviderMap[localConfig.provider]?.defaultConfig || defaultImageBedConfig;
        const reset = { ...base, _configName: localConfig._configName, provider: localConfig.provider };
        setLocalConfig(reset);
        onChange(reset);
    };

    const handleProviderSwitch = (provider: ImageBedProvider) => {
        if (provider === localConfig.provider) {
            setShowProviderMenu(false);
            return;
        }

        try {
            const multiConfigStr = localStorage.getItem('valpoint_imagebed_configs');
            if (multiConfigStr) {
                const multiConfigs = JSON.parse(multiConfigStr);
                const savedConfig = multiConfigs[provider];
                if (savedConfig) {
                    const normalized = normalizeConfig(savedConfig);
                    setLocalConfig(normalized);
                    onChange(normalized);
                    setShowProviderMenu(false);
                    return;
                }
            }
        } catch (e) {
            console.error('[ImageBedConfigForm] failed to load saved config:', e);
        }

        const base = imageBedProviderMap[provider]?.defaultConfig || defaultImageBedConfig;
        const newConfig = { ...base, _configName: '', provider };
        setLocalConfig(newConfig);
        onChange(newConfig);
        setShowProviderMenu(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
                {showProviderSwitch && (
                    <div className="relative">
                        <button
                            onClick={() => setShowProviderMenu((prev) => !prev)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors bg-white/5 border-white/10 text-white hover:border-white/30"
                        >
                            <Icon name="Layers" size={16} /> {currentDefinition.label}
                            <Icon name="ChevronDown" size={14} className={`transition-transform ${showProviderMenu ? 'rotate-180' : ''}`} />
                        </button>
                        {showProviderMenu && (
                            <div className="absolute left-0 top-12 w-64 rounded-xl border border-white/10 bg-[#0f131a] shadow-xl shadow-black/40 overflow-hidden z-50">
                                {imageBedProviderDefinitions.map((provider) => (
                                    <button
                                        key={provider.provider}
                                        onClick={() => handleProviderSwitch(provider.provider)}
                                        className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition-colors ${provider.provider === localConfig.provider ? 'bg-white/5' : ''
                                            }`}
                                    >
                                        <div className="flex-1">
                                            <div className="text-sm font-semibold text-white flex items-center gap-2">
                                                {provider.label}
                                                {provider.provider === localConfig.provider && <Icon name="Check" size={16} className="text-emerald-400" />}
                                            </div>
                                            <div className="text-xs text-gray-500 leading-snug">{provider.description}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {showCopyImport && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopy}
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${isCopied
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                : 'bg-white/5 border-white/10 text-white hover:border-white/30'
                                }`}
                        >
                            <Icon name={isCopied ? 'Check' : 'Copy'} size={16} /> {isCopied ? '已复制' : '复制'}
                        </button>
                        <button
                            onClick={handleImport}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors bg-white/5 border-white/10 text-white hover:border-white/30"
                        >
                            <Icon name="Download" size={16} /> 导入
                        </button>
                        {showReset && (
                            <button
                                onClick={handleReset}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/30"
                            >
                                <Icon name="RotateCcw" size={16} /> 重置
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className={`grid gap-4 ${layout === 'compact' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                {currentDefinition.fields.map((field) => (
                    <Field
                        key={`${currentDefinition.provider}-${field.key}`}
                        field={field}
                        value={localConfig[field.key]}
                        onChange={(val) => updateField(field.key, val)}
                    />
                ))}
            </div>

            <div className={`p-3 rounded-lg border ${isConfigValid ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                <div className="flex items-center gap-2">
                    <Icon name={isConfigValid ? 'CheckCircle' : 'AlertTriangle'} size={16} className={isConfigValid ? 'text-emerald-400' : 'text-amber-400'} />
                    <span className={`text-sm ${isConfigValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {isConfigValid ? '图床配置有效' : '请填写所有必填字段'}
                    </span>
                </div>
            </div>
        </div>
    );
};

type FieldProps = {
    field: ImageBedField;
    value: ImageBedConfig[keyof ImageBedConfig];
    onChange: (val: string | boolean) => void;
};

const Field: React.FC<FieldProps> = ({ field, value, onChange }) => {
    const { label, required, placeholder, type = 'text', options } = field;
    const isSwitch = type === 'switch';
    const isSelect = type === 'select';
    const displayValue = typeof value === 'boolean' ? value : value || '';
    const [isSelectOpen, setIsSelectOpen] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const selectRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isSelect) return;
        if (!isSelectOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (!selectRef.current) return;
            if (!selectRef.current.contains(e.target as Node)) {
                setIsSelectOpen(false);
            }
        };
        window.addEventListener('mousedown', handleClickOutside);
        return () => window.removeEventListener('mousedown', handleClickOutside);
    }, [isSelect, isSelectOpen]);

    return (
        <label className="flex flex-col gap-1 text-sm text-gray-300">
            <span className="text-xs text-gray-400">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </span>
            {isSwitch ? (
                <button
                    type="button"
                    onClick={() => onChange(!displayValue)}
                    className={`flex items-center justify-between w-full bg-[#0f131a] border border-white/10 rounded-lg px-3 py-2 text-left ${displayValue ? 'border-emerald-500/50' : ''
                        }`}
                >
                    <span className="text-white text-sm">{displayValue ? '已开启' : '未开启'}</span>
                    <span
                        className={`w-10 h-5 rounded-full p-[2px] transition-colors ${displayValue ? 'bg-emerald-500/80' : 'bg-white/10'
                            }`}
                    >
                        <span
                            className={`block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${displayValue ? 'translate-x-5' : ''
                                }`}
                        />
                    </span>
                </button>
            ) : isSelect ? (
                <div className="relative" ref={selectRef}>
                    <button
                        type="button"
                        onClick={() => setIsSelectOpen((prev) => !prev)}
                        className="w-full bg-[#0f131a] border border-white/10 rounded-lg px-3 py-2 text-left text-white focus:border-[#ff4655] outline-none transition-colors flex items-center justify-between gap-2"
                    >
                        <span className="truncate">{displayValue as string}</span>
                        <Icon
                            name="ChevronDown"
                            size={16}
                            className={`text-gray-400 transition-transform ${isSelectOpen ? 'rotate-180' : ''}`}
                        />
                    </button>
                    {isSelectOpen && (
                        <div className="absolute z-50 mt-1 w-full rounded-lg border border-white/10 bg-[#0b0f16]/95 shadow-xl shadow-black/50 backdrop-blur-md overflow-hidden">
                            {(options || []).map((opt) => {
                                const active = opt.value === displayValue;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                            onChange(opt.value);
                                            setIsSelectOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${active ? 'bg-white/10 text-white' : 'text-gray-200 hover:bg-white/5'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <div className="relative">
                    <input
                        type={field.type === 'password' && !isPasswordVisible ? 'password' : 'text'}
                        value={displayValue as string}
                        placeholder={placeholder}
                        onChange={(e) => onChange(e.target.value)}
                        className={`w-full bg-[#0f131a] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-[#ff4655] outline-none transition-colors ${field.type === 'password' ? 'pr-10' : ''}`}
                    />
                    {field.type === 'password' && (
                        <button
                            type="button"
                            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        >
                            <Icon name={isPasswordVisible ? 'EyeOff' : 'Eye'} size={16} />
                        </button>
                    )}
                </div>
            )}
            {field.helper && <span className="text-[11px] text-gray-500">{field.helper}</span>}
        </label>
    );
};

export default ImageBedConfigForm;
