import React, { useEffect, useMemo, useState } from 'react';
import Icon from './Icon';
import { ImageBedConfig, ImageBedProvider } from '../types/imageBed';
import {
  defaultImageBedConfig,
  imageBedProviderDefinitions,
  imageBedProviderMap,
  ImageBedField,
} from '../constants/imageBedProviders';

type Props = {
  isOpen: boolean;
  config: ImageBedConfig;
  onClose: () => void;
  onSave: (cfg: ImageBedConfig) => void;
};

const normalizeConfig = (incoming?: ImageBedConfig): ImageBedConfig => {
  const provider = incoming?.provider || defaultImageBedConfig.provider;
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

const ImageBedConfigModal: React.FC<Props> = ({ isOpen, config, onClose, onSave }) => {
  const [localConfig, setLocalConfig] = useState<ImageBedConfig>(defaultImageBedConfig);
  const [isCopied, setIsCopied] = useState(false);
  const [showProviderMenu, setShowProviderMenu] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalConfig(normalizeConfig(config));
      setIsCopied(false);
      setShowProviderMenu(false);
    }
  }, [isOpen, config]);

  const currentDefinition = useMemo(
    () => imageBedProviderMap[localConfig.provider] || imageBedProviderDefinitions[0],
    [localConfig.provider],
  );

  const updateField = (key: keyof ImageBedConfig, value: string | boolean) => {
    setLocalConfig((prev) => {
      const next: ImageBedConfig = { ...prev, [key]: value };
      if (prev.provider === 'aliyun') {
        if (key === 'area') next.region = typeof value === 'string' ? value : '';
        if (key === 'path') next.basePath = typeof value === 'string' ? value : '';
        if (key === 'customUrl') next.customDomain = typeof value === 'string' ? value : '';
      }
      return next;
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(localConfig, null, 2));
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
      setLocalConfig(normalizeConfig(parsed));
    } catch (e) {
      alert('解析失败，请确认格式正确。');
    }
  };

  const handleReset = () => {
    const base = imageBedProviderMap[localConfig.provider]?.defaultConfig || defaultImageBedConfig;
    setLocalConfig({ ...base, _configName: localConfig._configName, provider: localConfig.provider });
  };

  const handleProviderSwitch = (provider: ImageBedProvider) => {
    if (provider === localConfig.provider) {
      setShowProviderMenu(false);
      return;
    }
    const base = imageBedProviderMap[provider]?.defaultConfig || defaultImageBedConfig;
    setLocalConfig((prev) => ({
      ...base,
      _configName: prev._configName || base._configName,
      provider,
    }));
    setShowProviderMenu(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#181b1f]/95 shadow-2xl shadow-black/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#1c2028]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ff4655]/15 border border-[#ff4655]/35 flex items-center justify-center text-[#ff4655]">
              <Icon name="Cloudy" size={18} />
            </div>
            <div className="leading-tight">
              <div className="text-xl font-bold text-white">图床配置</div>
              <div className="text-xs text-gray-500">本地存储，仅当前设备生效，可复制 / 导入 / 导出</div>
            </div>
          </div>
          <div className="flex items-center gap-2 relative">
            <button
              onClick={() => setShowProviderMenu((prev) => !prev)}
              className="inline-flex items-center gap-2 px-3 py-[6px] rounded-lg border text-sm transition-colors bg-white/5 border-white/10 text-white hover:border-white/30"
            >
              <Icon name="Layers" size={16} /> {currentDefinition.label}
              <Icon name="ChevronDown" size={14} className={`transition-transform ${showProviderMenu ? 'rotate-180' : ''}`} />
            </button>
            {showProviderMenu && (
              <div className="absolute right-14 top-12 w-64 rounded-xl border border-white/10 bg-[#0f131a] shadow-xl shadow-black/40 overflow-hidden z-[1500]">
                {imageBedProviderDefinitions.map((provider) => (
                  <button
                    key={provider.provider}
                    onClick={() => handleProviderSwitch(provider.provider)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition-colors ${
                      provider.provider === localConfig.provider ? 'bg-white/5' : ''
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
            <button
              onClick={handleCopy}
              className={`inline-flex items-center gap-2 px-3 py-[6px] rounded-lg border text-sm transition-colors ${
                isCopied
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                  : 'bg-white/5 border-white/10 text-white hover:border-white/30'
              }`}
            >
              <Icon name={isCopied ? 'Check' : 'Copy'} size={16} /> {isCopied ? '已复制' : '复制配置'}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors"
              aria-label="关闭"
            >
              <Icon name="X" size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 bg-[#181b1f]">
          <div className="text-sm text-gray-400">当前图床：{currentDefinition.label}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentDefinition.fields.map((field) => (
              <Field
                key={`${currentDefinition.provider}-${field.key}`}
                field={field}
                value={localConfig[field.key]}
                onChange={(val) => updateField(field.key, val)}
              />
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-gray-500">提示：密钥仅保存在本机；如需换设备请先导出。</div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-lg border border-white/15 text-sm text-gray-200 hover:border-white/40 hover:bg-white/5 transition-colors"
              >
                重置当前图床
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 rounded-lg bg-[#ff4655] hover:bg-[#d93a49] text-white font-semibold text-sm transition-colors flex items-center gap-2 shadow-md shadow-red-900/30"
              >
                <Icon name="Download" size={16} /> 导入
              </button>
              <button
                onClick={() => onSave(localConfig)}
                className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-colors flex items-center gap-2 shadow-md shadow-emerald-900/30"
              >
                <Icon name="Check" size={16} /> 确认
              </button>
            </div>
          </div>
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
          className={`flex items-center justify-between w-full bg-[#0f131a] border border-white/10 rounded-lg px-3 py-2 text-left ${
            displayValue ? 'border-emerald-500/50' : ''
          }`}
        >
          <span className="text-white text-sm">{displayValue ? '已开启' : '未开启'}</span>
          <span
            className={`w-10 h-5 rounded-full p-[2px] transition-colors ${
              displayValue ? 'bg-emerald-500/80' : 'bg-white/10'
            }`}
          >
            <span
              className={`block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                displayValue ? 'translate-x-5' : ''
              }`}
            />
          </span>
        </button>
      ) : isSelect ? (
        <div className="relative">
          <select
            value={displayValue as string}
            onChange={(e) => onChange(e.target.value)}
            className="w-full appearance-none bg-[#0f131a] border border-white/10 rounded-lg px-3 py-2 pr-10 text-white focus:border-[#ff4655] outline-none transition-colors"
          >
            {(options || []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Icon name="ChevronDown" size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      ) : (
        <input
          value={displayValue as string}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#0f131a] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-[#ff4655] outline-none transition-colors"
        />
      )}
      {field.helper && <span className="text-[11px] text-gray-500">{field.helper}</span>}
    </label>
  );
};

export { defaultImageBedConfig } from '../constants/imageBedProviders';
export default ImageBedConfigModal;
