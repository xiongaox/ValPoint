/**
 * useActionMenu - 点位操作菜单
 *
 * 职责：
 * - 封装点位操作菜单相关的状态与副作用。
 * - 对外提供稳定的接口与回调。
 * - 处理订阅、清理或缓存等生命周期细节。
 */

import { useEffect, useState } from 'react';
import { defaultImageBedConfig } from '../../../components/ImageBedConfigModal';
import { ImageBedConfig } from '../../../types/imageBed';
import { useImageProcessingSettings } from '../../../hooks/useImageProcessingSettings';
import { ImageProcessingSettings } from '../../../types/imageProcessing';
import { imageBedProviderMap } from '../../../lib/imageBed';

type Params = {
  userId: string | null;
  setAlertMessage: (msg: string) => void;
  setIsAuthModalOpen: (val: boolean) => void;
  setPendingUserId: (val: string) => void;
  setCustomUserIdInput: (val: string) => void;
  setPasswordInput: (val: string) => void;
  handleClearAll: () => void;
  setIsChangePasswordOpen: (v: boolean) => void;
};

export function useActionMenu({
  userId,
  setAlertMessage,
  setIsAuthModalOpen,
  setPendingUserId,
  setCustomUserIdInput,
  setPasswordInput,
  handleClearAll,
  setIsChangePasswordOpen,
}: Params) {
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isImageConfigOpen, setIsImageConfigOpen] = useState(false);
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false);
  const [isPngSettingsOpen, setIsPngSettingsOpen] = useState(false);
  const [imageBedConfig, setImageBedConfig] = useState<ImageBedConfig>(defaultImageBedConfig);
  const { settings: imageProcessingSettings, saveSettings: saveImageProcessingSettings } = useImageProcessingSettings();

  const normalizeImageBedConfig = (raw: ImageBedConfig): ImageBedConfig => {
    const providerCandidate = raw?.provider;
    const provider =
      providerCandidate && imageBedProviderMap[providerCandidate]
        ? providerCandidate
        : defaultImageBedConfig.provider;
    const base = imageBedProviderMap[provider]?.defaultConfig || defaultImageBedConfig;
    const merged: ImageBedConfig = {
      ...base,
      ...raw,
      provider,
      _configName: raw?._configName || (raw as { name?: string })?.name || base._configName,
    };
    if (provider === 'aliyun') {
      if (!merged.area && merged.region) merged.area = merged.region;
      if (merged.area && !merged.region) merged.region = merged.area;
      if (merged.path && !merged.basePath) merged.basePath = merged.path;
      if (merged.customUrl && !merged.customDomain) merged.customDomain = merged.customUrl;
    }
    return merged;
  };

  useEffect(() => {
    try {
      const multiConfigStr = localStorage.getItem('valpoint_imagebed_configs');
      if (multiConfigStr) {
        const multiConfigs = JSON.parse(multiConfigStr);
        const lastProvider = localStorage.getItem('valpoint_imagebed_last_provider');
        const currentProvider = lastProvider || defaultImageBedConfig.provider;
        const savedConfig = multiConfigs[currentProvider];
        if (savedConfig) {
          setImageBedConfig(normalizeImageBedConfig(savedConfig));
          return;
        }
      }

      const saved = localStorage.getItem('valpoint_imagebed_config');
      if (saved) {
        const oldConfig = JSON.parse(saved);
        setImageBedConfig(normalizeImageBedConfig(oldConfig));

        const multiConfigs = { [oldConfig.provider]: oldConfig };
        localStorage.setItem('valpoint_imagebed_configs', JSON.stringify(multiConfigs));
        localStorage.setItem('valpoint_imagebed_last_provider', oldConfig.provider);
        localStorage.removeItem('valpoint_imagebed_config');
      }
    } catch (e) {
      console.error(e);
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'valpoint_imagebed_configs' || e.key === 'valpoint_imagebed_last_provider') {
        try {
          const multiConfigStr = localStorage.getItem('valpoint_imagebed_configs');
          if (multiConfigStr) {
            const multiConfigs = JSON.parse(multiConfigStr);
            const lastProvider = localStorage.getItem('valpoint_imagebed_last_provider');
            const currentProvider = lastProvider || defaultImageBedConfig.provider;
            const savedConfig = multiConfigs[currentProvider];
            if (savedConfig) {
              setImageBedConfig(normalizeImageBedConfig(savedConfig));
            }
          }
        } catch (err) {
          console.error(err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleImageBedConfig = () => {
    setIsActionMenuOpen(false);
    setIsImageConfigOpen(true);
  };

  const handleChangePassword = () => {
    if (!userId) {
      setAlertMessage('请先创建或登录一个 ID，再修改密码');
      setIsAuthModalOpen(true);
      return;
    }
    setIsActionMenuOpen(false);
    setIsChangePasswordOpen(true);
  };

  const handleQuickClear = () => {
    setIsActionMenuOpen(false);
    handleClearAll();
  };

  const handleImageConfigSave = (cfg: ImageBedConfig) => {
    const normalized = normalizeImageBedConfig(cfg);
    setImageBedConfig(normalized);
    try {
      const multiConfigStr = localStorage.getItem('valpoint_imagebed_configs');
      const multiConfigs = multiConfigStr ? JSON.parse(multiConfigStr) : {};

      multiConfigs[normalized.provider] = normalized;

      localStorage.setItem('valpoint_imagebed_configs', JSON.stringify(multiConfigs));
      localStorage.setItem('valpoint_imagebed_last_provider', normalized.provider);
    } catch (e) {
      console.error(e);
    }
    setAlertMessage('图床配置已保存，仅当前设备生效');
    setIsImageConfigOpen(false);
  };

  const handleOpenAdvancedSettings = () => {
    setIsActionMenuOpen(false);
    setIsAdvancedSettingsOpen(true);
  };

  const handleOpenPngSettings = () => {
    setIsActionMenuOpen(false);
    setIsPngSettingsOpen(true);
  };

  const handleImageProcessingSave = (cfg: ImageProcessingSettings) => {
    saveImageProcessingSettings(cfg);
    setAlertMessage('设置已保存');
    setIsAdvancedSettingsOpen(false);
    setIsPngSettingsOpen(false);
  };

  return {
    isActionMenuOpen,
    setIsActionMenuOpen,
    isImageConfigOpen,
    setIsImageConfigOpen,
    isAdvancedSettingsOpen,
    setIsAdvancedSettingsOpen,
    isPngSettingsOpen,
    setIsPngSettingsOpen,
    imageBedConfig,
    setImageBedConfig,
    imageProcessingSettings,
    handleImageBedConfig,
    handleOpenAdvancedSettings,
    handleOpenPngSettings,
    handleChangePassword,
    handleQuickClear,
    handleImageConfigSave,
    handleImageProcessingSave,
  };
}
