// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import { uploadToOss } from '../utils/ossUpload';
import { prepareClipboardImage } from '../lib/imageCompression';
import { fetchAuthorInfo } from '../utils/authorFetcher';

const fields = [
  { k: 'stand', l: '站位图' },
  { k: 'stand2', l: '站位图2', toggleKey: 'enableStand2' },
  { k: 'aim', l: '瞄点图' },
  { k: 'aim2', l: '瞄点图2', toggleKey: 'enableAim2' },
  { k: 'land', l: '技能落点图' },
];

const EditorModal = ({
  isEditorOpen,
  editingLineupId,
  newLineupData,
  setNewLineupData,
  handleEditorSave,
  onClose,
  selectedSide,
  setSelectedSide,
  imageBedConfig,
  setAlertMessage,
  imageProcessingSettings,
}) => {
  if (!isEditorOpen) return null;
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [uploadingField, setUploadingField] = useState(null);
  const [isPastingSourceLink, setIsPastingSourceLink] = useState(false);
  const [isFetchingAuthor, setIsFetchingAuthor] = useState(false);
  const fetchTimeoutRef = useRef(null);

  // 自动获取作者信息（防抖）
  useEffect(() => {
    const link = newLineupData.sourceLink?.trim();

    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    if (!link || newLineupData.authorName) {
      return;
    }

    fetchTimeoutRef.current = setTimeout(async () => {
      try {
        setIsFetchingAuthor(true);
        const authorInfo = await fetchAuthorInfo(link);

        if (authorInfo) {
          setNewLineupData((prev) => ({
            ...prev,
            authorName: authorInfo.name,
            authorAvatar: authorInfo.avatar,
            authorUid: authorInfo.uid || '',
          }));
        }
      } catch (error) {
        console.error('自动获取作者信息失败:', error);
      } finally {
        setIsFetchingAuthor(false);
      }
    }, 1000);

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [newLineupData.sourceLink, setNewLineupData]);

  const updateSourceLink = (value) => {
    setNewLineupData((prev) => ({
      ...prev,
      sourceLink: value,
      authorName: '',
      authorAvatar: '',
      authorUid: '',
    }));
  };

  const extractSourceLink = (rawText) => {
    if (!rawText) return '';
    const matches = rawText.match(/https?:\/\/[^\s"'<>]+/g) || [];
    const priorities = ['bilibili.com', 'douyin.com', 'tiktok.com'];
    const prioritized = matches.find((url) => priorities.some((host) => url.includes(host)));
    return prioritized || matches[0] || '';
  };

  const handlePasteSourceLink = async () => {
    if (!navigator.clipboard?.readText) {
      setAlertMessage?.('当前浏览器不支持读取剪贴板内容');
      return;
    }
    try {
      setIsPastingSourceLink(true);
      const text = (await navigator.clipboard.readText())?.trim();
      const extracted = extractSourceLink(text);
      if (!extracted) {
        setAlertMessage?.('剪贴板没有可用的链接');
        return;
      }
      const candidate = /^https?:\/\//i.test(extracted) ? extracted : `https://${extracted}`;
      try {
        const url = new URL(candidate);
        updateSourceLink(url.toString());
        // 静默更新，不再弹窗提示
      } catch {
        setAlertMessage?.('剪贴板内容不是有效的链接');
      }
    } catch (error) {
      console.error('读取剪贴板失败', error);
      setAlertMessage?.('读取剪贴板失败，请手动粘贴');
    } finally {
      setIsPastingSourceLink(false);
    }
  };

  const handleClearSourceLink = () => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    updateSourceLink('');
    setIsFetchingAuthor(false);
  };

  const handleClipboardUpload = async (fieldKey) => {
    if (!navigator.clipboard?.read) {
      setAlertMessage?.('Clipboard API not supported in this browser');
      return;
    }

    // 验证图床配置（根据不同平台验证不同字段）
    if (!imageBedConfig?.provider) {
      setAlertMessage?.('Image hosting not configured. Please configure it first.');
      return;
    }

    const provider = imageBedConfig.provider;
    let missingFields: string[] = [];

    console.log('[EditorModal] validating config', { provider, config: imageBedConfig });

    if (provider === 'aliyun') {
      missingFields = ['accessKeyId', 'accessKeySecret', 'bucket', 'area'].filter((k) => !imageBedConfig?.[k]);
    } else if (provider === 'tencent') {
      missingFields = ['secretId', 'secretKey', 'bucket', 'appId', 'area'].filter((k) => !imageBedConfig?.[k]);
    } else if (provider === 'qiniu') {
      missingFields = ['accessKey', 'secretKey', 'bucket', 'url', 'area'].filter((k) => !imageBedConfig?.[k]);
    }

    if (missingFields.length > 0) {
      console.error('[EditorModal] missing required fields:', missingFields);
      setAlertMessage?.(`Missing required config fields: ${missingFields.join(', ')}`);
      return;
    }

    console.log('[EditorModal] config validation passed');

    try {
      setUploadingField(fieldKey);
      console.log('[EditorModal] starting clipboard upload');

      const items = await navigator.clipboard.read();
      const imgItem = items.find((item) => item.types.some((t) => t.startsWith('image/')));
      if (!imgItem) {
        console.warn('[EditorModal] no image found in clipboard');
        setAlertMessage?.('No image found in clipboard');
        return;
      }

      const imgType = imgItem.types.find((t) => t.startsWith('image/')) || 'image/png';
      const blob = await imgItem.getType(imgType);
      console.log('[EditorModal] image from clipboard', { type: imgType, size: blob.size });

      const fileForUpload = await prepareClipboardImage(blob, 'clipboard_' + Date.now(), imageProcessingSettings);
      console.log('[EditorModal] image processed', { size: fileForUpload.size });

      const result = await uploadToOss(fileForUpload, imageBedConfig);
      console.log('[EditorModal] upload success', { url: result.url });

      setNewLineupData({ ...newLineupData, [fieldKey + 'Img']: result.url });
    } catch (e) {
      console.error('[EditorModal] upload error:', e);
      if (e?.message?.includes('MISSING_CONFIG') || e?.message?.includes('Missing required config')) {
        setAlertMessage?.('Image hosting config incomplete. Please check your settings.');
      } else if (
        e?.message === 'JPEG_CONVERSION_FAILED' ||
        e?.message === 'IMAGE_LOAD_FAILED' ||
        e?.message === 'CANVAS_CONTEXT_UNAVAILABLE'
      ) {
        setAlertMessage?.('Image processing failed. Please try another image.');
      } else {
        setAlertMessage?.(`Upload failed: ${e?.message || 'Unknown error'}`);
      }
    } finally {
      setUploadingField(null);
    }
  };

  const handleClearImage = (fieldKey) => {
    setNewLineupData({ ...newLineupData, [`${fieldKey}Img`]: '' });
  };

  const toggleField = (field) => {
    if (!field.toggleKey) return;
    const enabled = newLineupData[field.toggleKey];
    if (enabled) {
      setNewLineupData({
        ...newLineupData,
        [field.toggleKey]: false,
        [`${field.k}Img`]: '',
        [`${field.k}Desc`]: '',
      });
    } else {
      setNewLineupData({ ...newLineupData, [field.toggleKey]: true });
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] pointer-events-none flex justify-end">
      <div className="pointer-events-auto h-full w-[383px] max-w-[383px] min-w-[383px] bg-[#10151b]/95 backdrop-blur-md border-l border-[#1b1f2a] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-[#1b1f2a] bg-[#1f2326]/90">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Icon name="FileText" className="text-[#ff4655]" /> {editingLineupId ? '编辑图文攻略' : '新增图文攻略'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-[#1b1f2a] text-gray-400 hover:text-white hover:border-[#ff4655]/50 transition-colors"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-2">标题 (Title)</label>
              <input
                className="w-full bg-[#0f1923] border border-[#2a323d] rounded-lg p-3 text-white focus:border-[#ff4655] outline-none transition-colors"
                placeholder="例如：B区窗户进攻瞬爆烟"
                value={newLineupData.title}
                onChange={(e) => setNewLineupData({ ...newLineupData, title: e.target.value })}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-bold text-gray-500 uppercase">阵营 (Side)</div>
              <div className="w-full flex items-center gap-2 bg-[#0b1220] border border-[#2a323d] rounded-xl px-2 py-2 shadow-inner shadow-black/40">
                <button
                  type="button"
                  onClick={() => setSelectedSide('attack')}
                  className={`flex-1 justify-center flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedSide === 'attack'
                      ? 'bg-gradient-to-r from-[#ff5b6b] to-[#ff3c4d] text-white shadow-lg shadow-red-900/30'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <Icon name="Sword" size={16} /> 进攻 (ATK)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSide('defense')}
                  className={`flex-1 justify-center flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedSide === 'defense'
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <Icon name="Shield" size={16} /> 防守 (DEF)
                </button>
              </div>
            </div>
            <div>
              <div className="bg-[#0f1923] border border-[#2a323d] rounded-xl p-3 space-y-3 shadow-inner shadow-black/30">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">点位来源链接 (可选)</label>
                  <button
                    type="button"
                    onClick={async () => {
                      const link = newLineupData.sourceLink?.trim();
                      if (!link) {
                        setAlertMessage?.('请先输入来源链接');
                        return;
                      }
                      try {
                        setIsFetchingAuthor(true);
                        const authorInfo = await fetchAuthorInfo(link);
                        if (authorInfo) {
                          setNewLineupData((prev) => ({
                            ...prev,
                            authorName: authorInfo.name,
                            authorAvatar: authorInfo.avatar,
                            authorUid: authorInfo.uid || '',
                          }));
                          setAlertMessage?.('作者信息已更新');
                        } else {
                          setAlertMessage?.('无法获取作者信息');
                        }
                      } catch (error) {
                        console.error('手动刷新作者信息失败:', error);
                        setAlertMessage?.('获取作者信息失败');
                      } finally {
                        setIsFetchingAuthor(false);
                      }
                    }}
                    disabled={isFetchingAuthor || !newLineupData.sourceLink?.trim()}
                    className="text-[11px] text-gray-400 hover:text-[#ff4655] flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon name="RefreshCw" size={12} className={isFetchingAuthor ? 'animate-spin' : ''} />
                    {isFetchingAuthor ? '获取中...' : '手动刷新'}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePasteSourceLink}
                    disabled={isPastingSourceLink}
                    className="flex-1 h-10 px-3 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-[#ff5b6b] to-[#ff3c4d] hover:from-[#ff6c7b] hover:to-[#ff4c5e] shadow-md shadow-red-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Icon name="ClipboardCheck" size={14} />
                    {isPastingSourceLink ? '读取中...' : '剪贴板填入'}
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSourceLink}
                    className="h-10 px-3 rounded-lg border border-[#2a323d] bg-[#0f1923] text-xs text-gray-200 hover:border-red-500/60 hover:text-red-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Icon name="Eraser" size={14} />
                    清空
                  </button>
                  {newLineupData.sourceLink && (
                    <a
                      href={newLineupData.sourceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-xs text-gray-200 hover:border-[#ff4655] hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                      <Icon name="ExternalLink" size={14} />
                      打开
                    </a>
                  )}
                </div>
                <input
                  className="w-full bg-[#0f1923] border border-[#2a323d] rounded-lg p-3 text-white focus:border-[#ff4655] outline-none transition-colors"
                  placeholder="B站视频链接，查看时可点击跳转，并自动获取作者信息"
                  value={newLineupData.sourceLink || ''}
                  onChange={(e) => updateSourceLink(e.target.value)}
                />
              </div>
              {isFetchingAuthor && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <Icon name="Loader" size={14} className="text-blue-400 animate-spin" />
                  <span className="text-sm text-blue-300">正在获取作者信息...</span>
                </div>
              )}
              {newLineupData.authorName && newLineupData.authorAvatar && !isFetchingAuthor && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <img src={newLineupData.authorAvatar} className="w-6 h-6 rounded-full" alt={newLineupData.authorName} referrerPolicy="no-referrer" />
                  <span className="text-sm text-emerald-300">{newLineupData.authorName}</span>
                  <Icon name="Check" size={14} className="text-emerald-400 ml-auto" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 uppercase font-bold">
            <span>截图与描述</span>
            <button
              type="button"
              onClick={() => setShowLinkInput((v) => !v)}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-[11px] text-white hover:border-[#ff4655] hover:bg-[#ff4655]/10 transition-colors flex items-center gap-1"
            >
              <Icon name="Link" size={12} />
              {showLinkInput ? '关闭链接输入' : '启用链接输入'}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {fields.map((field) => {
              const enabled = field.toggleKey ? newLineupData[field.toggleKey] : true;
              const hasData = newLineupData[`${field.k}Img`] || newLineupData[`${field.k}Desc`];
              const shouldShow = enabled || hasData || !field.toggleKey;
              if (!shouldShow) {
                return (
                  <div key={field.k} className="bg-[#11161d] p-4 rounded-lg border border-dashed border-[#2a323d] flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Icon name="Image" size={14} className="text-[#ff4655]" />
                      <span>{field.l}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#1c2430] border border-[#1b1f2a] text-gray-500">未启用</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleField(field)}
                      className="px-3 py-1.5 rounded border border-[#1b1f2a] text-xs text-white hover:border-[#ff4655] hover:text-[#ff4655] transition-colors"
                    >
                      启用
                    </button>
                  </div>
                );
              }

              return (
                <div key={field.k} className="bg-[#11161d] p-4 rounded-lg border border-[#1b1f2a]">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-[#ff4655] font-bold text-sm flex items-center gap-2 uppercase tracking-wider">
                      <Icon name="Image" size={14} /> {field.l}
                    </div>
                    {field.toggleKey && (
                      <button
                        type="button"
                        onClick={() => toggleField(field)}
                        className="px-3 py-1 rounded border border-[#1b1f2a] text-xs text-gray-300 hover:border-[#ff4655] hover:text-[#ff4655] transition-colors"
                      >
                        关闭
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-3">
                    {!showLinkInput && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleClipboardUpload(field.k)}
                          disabled={uploadingField === field.k}
                          className="h-10 flex-1 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-[#ff5b6b] to-[#ff3c4d] hover:from-[#ff6c7b] hover:to-[#ff4c5e] shadow-md shadow-red-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <Icon name="ClipboardCheck" size={14} />
                          {uploadingField === field.k ? '上传中...' : '剪贴板上传'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleClearImage(field.k)}
                          className="h-10 flex-1 px-3 py-2 rounded-lg border border-[#2a323d] bg-[#0f1923] text-xs text-gray-200 hover:border-red-500/60 hover:text-red-200 transition-colors flex items-center justify-center gap-2"
                        >
                          <Icon name="Eraser" size={14} />
                          清除预览图
                        </button>
                      </div>
                    )}

                    {showLinkInput && (
                      <input
                        className="w-full h-10 bg-[#0f1923] border border-[#2a323d] rounded-lg px-3 text-sm text-white placeholder-gray-500 leading-5 focus:border-[#ff4655] outline-none"
                        placeholder="图片链接（可选）"
                        value={newLineupData[`${field.k}Img`]}
                        onChange={(e) => setNewLineupData({ ...newLineupData, [`${field.k}Img`]: e.target.value })}
                      />
                    )}

                    <textarea
                      className="w-full bg-[#0f1923] border border-[#2a323d] rounded-lg p-2 text-sm text-white placeholder-gray-500 h-16 resize-none overflow-y-auto focus:border-[#ff4655] outline-none"
                      placeholder="描述（可选）"
                      value={newLineupData[`${field.k}Desc`]}
                      onChange={(e) => setNewLineupData({ ...newLineupData, [`${field.k}Desc`]: e.target.value })}
                    />

                    {newLineupData[`${field.k}Img`] ? (
                      <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#0f1923] h-40">
                        <img
                          src={newLineupData[`${field.k}Img`]}
                          alt={`${field.l} 预览`}
                          className="w-full h-full object-cover"
                          onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                        />
                      </div>
                    ) : (
                      <div className="h-40 flex items-center justify-center text-xs text-gray-600 border border-dashed border-[#2a323d] rounded-lg bg-[#0f1923]">
                        暂无预览
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="p-5 border-t border-[#1b1f2a] flex justify-end gap-3 bg-[#1f2326]/90">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg border border-[#2a323d] bg-[#0f1923] text-sm font-bold text-gray-200 hover:border-[#ff4655] hover:text-white hover:bg-white/5 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleEditorSave}
            className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-[#ff5b6b] to-[#ff3c4d] hover:from-[#ff6c7b] hover:to-[#ff4c5e] shadow-lg shadow-red-900/30 transition-all"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorModal;
