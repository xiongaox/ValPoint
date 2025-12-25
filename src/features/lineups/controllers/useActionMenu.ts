/**
 * useActionMenu - 快捷操作菜单控制器
 * 
 * 管理主界面快捷操作菜单的状态和行为：
 * - 图床配置的读取、保存和多平台切换
 * - 图片处理设置（压缩、格式转换）
 * - 密码修改、清空点位等操作入口
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
  const [isImageProcessingOpen, setIsImageProcessingOpen] = useState(false);
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
      // 尝试读取多平台配置
      const multiConfigStr = localStorage.getItem('valpoint_imagebed_configs');
      if (multiConfigStr) {
        const multiConfigs = JSON.parse(multiConfigStr);
        // 使用当前 provider 的配置，如果没有则使用默认
        const currentProvider = imageBedConfig.provider || defaultImageBedConfig.provider;
        const savedConfig = multiConfigs[currentProvider];
        if (savedConfig) {
          setImageBedConfig(normalizeImageBedConfig(savedConfig));
          return;
        }
      }

      // 兼容旧版单一配置
      const saved = localStorage.getItem('valpoint_imagebed_config');
      if (saved) {
        const oldConfig = JSON.parse(saved);
        setImageBedConfig(normalizeImageBedConfig(oldConfig));

        // 迁移到新格式
        const multiConfigs = { [oldConfig.provider]: oldConfig };
        localStorage.setItem('valpoint_imagebed_configs', JSON.stringify(multiConfigs));
        localStorage.removeItem('valpoint_imagebed_config');
      }
    } catch (e) {
      console.error(e);
    }
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
    setPendingUserId(userId);
    setCustomUserIdInput(userId);
    setPasswordInput('');
    setIsImageProcessingOpen(true);
  };

  const handleQuickClear = () => {
    setIsActionMenuOpen(false);
    handleClearAll();
  };

  const handleImageConfigSave = (cfg: ImageBedConfig) => {
    const normalized = normalizeImageBedConfig(cfg);
    setImageBedConfig(normalized);
    try {
      // 读取现有的多平台配置
      const multiConfigStr = localStorage.getItem('valpoint_imagebed_configs');
      const multiConfigs = multiConfigStr ? JSON.parse(multiConfigStr) : {};

      // 更新当前平台的配置
      multiConfigs[normalized.provider] = normalized;

      // 保存回 localStorage
      localStorage.setItem('valpoint_imagebed_configs', JSON.stringify(multiConfigs));

      console.log('[useActionMenu] saved config for provider:', normalized.provider);
    } catch (e) {
      console.error(e);
    }
    setAlertMessage('图床配置已保存，仅当前设备生效');
    setIsImageConfigOpen(false);
  };

  const handleOpenAdvancedSettings = () => {
    setIsActionMenuOpen(false);
    setIsImageProcessingOpen(true);
  };

  const handleImageProcessingSave = (cfg: ImageProcessingSettings) => {
    saveImageProcessingSettings(cfg);
    setAlertMessage('高级设置已保存，仅当前设备生效');
    setIsImageProcessingOpen(false);
  };

  return {
    isActionMenuOpen,
    setIsActionMenuOpen,
    isImageConfigOpen,
    setIsImageConfigOpen,
    isImageProcessingOpen,
    setIsImageProcessingOpen,
    imageBedConfig,
    setImageBedConfig,
    imageProcessingSettings,
    handleImageBedConfig,
    handleOpenAdvancedSettings,
    handleChangePassword,
    handleQuickClear,
    handleImageConfigSave,
    handleImageProcessingSave,
  };
}
