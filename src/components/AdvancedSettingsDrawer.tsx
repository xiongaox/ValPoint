import React, { useState } from 'react';
import Icon from './Icon';
import { ImageProcessingSettings } from '../types/imageProcessing';

type Props = {
  isOpen: boolean;
  settings: ImageProcessingSettings;
  onClose: () => void;
  onSave: (settings: ImageProcessingSettings) => void;
  userId: string | null;
  isChangingPassword: boolean;
  onChangePasswordSubmit: (oldPassword: string, newPassword: string, confirmPassword: string) => void;
};

const clampQuality = (val: number) => Math.min(1, Math.max(0.1, val));

const AdvancedSettingsDrawer: React.FC<Props> = ({ isOpen, settings, onClose, onSave, userId, isChangingPassword, onChangePasswordSubmit }) => {
  const [localSettings, setLocalSettings] = useState<ImageProcessingSettings>(settings);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordPanel, setShowPasswordPanel] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordPanel(false);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleQualityChange = (val: number) => {
    setLocalSettings((prev) => ({ ...prev, jpegQuality: clampQuality(val) }));
  };

  const handleSave = () => {
    onSave(localSettings);
  };

  const handlePasswordSubmit = () => {
    onChangePasswordSubmit(oldPassword, newPassword, confirmPassword);
  };

  return (
    <>
      <div className="fixed inset-0 z-[1100] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-[#1f2326] border-l border-white/10 z-[1101] shadow-2xl flex flex-col animate-in slide-in-from-right">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ff4655]/15 border border-[#ff4655]/35 flex items-center justify-center text-[#ff4655]">
              <Icon name="SlidersHorizontal" size={18} />
            </div>
            <div className="leading-tight">
              <h3 className="text-lg font-bold text-white">高级设置</h3>
              <p className="text-xs text-gray-400">当前仅提供剪贴板图片压缩相关设置</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-[#ff4655]/50 transition-colors"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="bg-[#0f1923] border border-white/10 rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Icon name="Image" size={18} className="text-[#ff4655]" />
                  <div className="text-sm font-bold text-white">PNG 转换</div>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">剪贴板图片可转成 JPG 或 WebP，并进行压缩以便上传。</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <button
                  onClick={() => setLocalSettings((prev) => ({ ...prev, enablePngConversion: !prev.enablePngConversion }))}
                  className={`relative w-14 h-8 rounded-full border transition-colors flex items-center px-1 flex-shrink-0 ${
                    localSettings.enablePngConversion ? 'bg-[#ff4655] border-[#ff7884]' : 'bg-[#1c2430] border-white/10'
                  }`}
                >
                  <div
                    className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-150 ${
                      localSettings.enablePngConversion ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {localSettings.enablePngConversion && (
              <div className="pt-4 border-t border-white/10 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">输出格式</div>
                    <p className="text-xs text-gray-400 mt-1">选择转换后的格式。</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setLocalSettings((prev) => ({ ...prev, pngConvertFormat: 'jpeg' }))}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                        localSettings.pngConvertFormat === 'jpeg'
                          ? 'bg-[#ff4655]/20 border-[#ff7884] text-white'
                          : 'border-white/10 text-gray-400 hover:text-white hover:border-[#ff4655]/50'
                      }`}
                    >
                      JPG
                    </button>
                    <button
                      onClick={() => setLocalSettings((prev) => ({ ...prev, pngConvertFormat: 'webp' }))}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                        localSettings.pngConvertFormat === 'webp'
                          ? 'bg-[#ff4655]/20 border-[#ff7884] text-white'
                          : 'border-white/10 text-gray-400 hover:text-white hover:border-[#ff4655]/50'
                      }`}
                    >
                      WebP
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">压缩系数</div>
                    <p className="text-xs text-gray-400 mt-1">范围 0.1 - 1，越高越清晰</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min={0.1}
                      max={1}
                      value={localSettings.jpegQuality.toFixed(2)}
                      onChange={(e) => handleQualityChange(Number(e.target.value))}
                      className="w-20 bg-[#0f1923] border border-[#2a323d] rounded-lg px-2 py-1 text-sm text-white focus:border-[#ff4655] outline-none"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.01}
                  value={localSettings.jpegQuality}
                  onChange={(e) => handleQualityChange(Number(e.target.value))}
                  className="w-full accent-[#ff4655]"
                />
              </div>
            )}
          </div>

          <div className="bg-[#0f1923] border border-white/10 rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Icon name="Key" size={18} className="text-[#ff4655]" />
                  <div className="text-sm font-bold text-white">修改密码</div>
                </div>
                <span className="text-xs text-gray-500 block">当前 ID：{userId ?? '未登录'}</span>
              </div>
              <button
                onClick={() => setShowPasswordPanel((v) => !v)}
                className={`relative w-14 h-8 rounded-full border transition-colors flex items-center px-1 flex-shrink-0 ${
                  showPasswordPanel ? 'bg-[#ff4655] border-[#ff7884]' : 'bg-[#1c2430] border-white/10'
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-150 ${
                    showPasswordPanel ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            {showPasswordPanel && (
              <div className="space-y-3 animate-in fade-in">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">原密码</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full bg-[#0f131a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#ff4655] outline-none transition-colors"
                    placeholder="请输入当前密码"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">新密码</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#0f131a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#ff4655] outline-none transition-colors"
                    placeholder="请输入新密码"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">确认新密码</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#0f131a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#ff4655] outline-none transition-colors"
                    placeholder="请再次输入新密码"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      setOldPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="px-4 py-2 rounded-lg border border-white/15 text-sm text-gray-200 hover:border-white/40 hover:bg-white/5 transition-colors"
                    disabled={isChangingPassword}
                  >
                    重置
                  </button>
                  <button
                    onClick={handlePasswordSubmit}
                    disabled={isChangingPassword}
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#ff5b6b] to-[#ff3c4d] hover:from-[#ff6c7b] hover:to-[#ff4c5e] text-white font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 shadow-md shadow-red-900/30"
                  >
                    {isChangingPassword && <Icon name="Loader2" size={16} className="animate-spin" />}
                    保存密码
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-white/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-white/10 text-sm text-gray-200 hover:text-white hover:border-[#ff4655]/50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-[#ff5b6b] to-[#ff3c4d] hover:from-[#ff6c7b] hover:to-[#ff4c5e] shadow-lg shadow-red-900/30 transition-all"
          >
            保存设置
          </button>
        </div>
      </div>
    </>
  );
};

export default AdvancedSettingsDrawer;
