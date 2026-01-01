/**
 * ViewerModal - 查看弹窗
 *
 * 职责：
 * - 渲染查看弹窗内容与操作区域。
 * - 处理打开/关闭、确认/取消等交互。
 * - 与表单校验或数据提交逻辑联动。
 */

// @ts-nocheck
import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import { fetchAuthorInfo } from '../utils/authorFetcher';
import { useIsMobile } from '../hooks/useIsMobile';
import { useEscapeClose } from '../hooks/useEscapeClose';

const ViewerModal = ({
  viewingLineup,
  onClose,
  handleEditStart,
  setViewingImage,
  getMapDisplayName,
  getMapEnglishName,
  isGuest,
  handleCopyShared = undefined,
  isSavingShared = false,
  handleSaveToPersonal = undefined,
  isSavingToPersonal = false,
  onSubmitLineup, // 说明：投稿回调。
  isAdmin = true, // 说明：是否管理员，默认 true 不显示投稿按钮。
}: any) => {
  const [authorInfo, setAuthorInfo] = useState<{ name: string; avatar: string; uid?: string } | null>(null);
  const [isLoadingAuthor, setIsLoadingAuthor] = useState(false);
  const isMobile = useIsMobile();

  useEscapeClose(Boolean(viewingLineup), onClose);

  useEffect(() => {
    if (!viewingLineup?.sourceLink) {
      setAuthorInfo(null);
      setIsLoadingAuthor(false);
      return;
    }

    if (viewingLineup?.authorName && viewingLineup?.authorAvatar) {
      setAuthorInfo({
        name: viewingLineup.authorName,
        avatar: viewingLineup.authorAvatar,
        uid: viewingLineup.authorUid || undefined,
      });
      return;
    }

    setIsLoadingAuthor(true);
    fetchAuthorInfo(viewingLineup.sourceLink)
      .then((info) => {
        if (info) setAuthorInfo(info);
      })
      .finally(() => setIsLoadingAuthor(false));
  }, [viewingLineup]);

  if (!viewingLineup) return null;

  const imageItems = [
    { src: viewingLineup.standImg, desc: viewingLineup.standDesc, label: '站位 (Stand)' },
    { src: viewingLineup.stand2Img, desc: viewingLineup.stand2Desc, label: '站位 2 (Stand)' },
    { src: viewingLineup.aimImg, desc: viewingLineup.aimDesc, label: '瞄点 (Aim)' },
    { src: viewingLineup.aim2Img, desc: viewingLineup.aim2Desc, label: '瞄点 2 (Aim)' },
    { src: viewingLineup.landImg, desc: viewingLineup.landDesc, label: '落点 (Land)' },
  ];
  const imageList = imageItems.filter((item) => item.src).map((item) => item.src);

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center p-0 md:p-4"
    >
      <div className={`modal-content bg-[#1f2326] flex flex-col rounded-none md:rounded-xl border-0 md:border border-white/10 shadow-2xl overflow-hidden relative ${isMobile ? 'w-full h-full' : 'w-full max-w-4xl max-h-[90vh]'
        }`}>
        <div className={`border-b border-white/10 bg-[#252a30] ${isMobile ? 'p-4' : 'p-6'}`}>
          {isMobile && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/40 text-white hover:bg-[#ff4655]/20"
            >
              <Icon name="X" size={20} />
            </button>
          )}

          <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex items-start justify-between gap-4'}`}>
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className={`text-[12px] font-bold px-2 py-0.5 rounded ${viewingLineup.side === 'attack' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                >
                  {viewingLineup.side === 'attack' ? '进攻 (ATK)' : '防守 (DEF)'}
                </span>
                <span className="text-[12px] text-gray-500 font-mono">
                  {getMapDisplayName(getMapEnglishName(viewingLineup.mapName))}
                </span>
              </div>
              <h2 className={`font-bold text-white tracking-tight ${isMobile ? 'text-xl' : 'text-2xl'}`}>{viewingLineup.title}</h2>
              <div className="flex items-center gap-2 opacity-70">
                {viewingLineup.agentIcon && <img src={viewingLineup.agentIcon} className="w-7 h-7 rounded-full" />}
                <span className="text-sm font-bold text-white">{viewingLineup.agentName}</span>
              </div>
            </div>

            <div className={`flex items-center gap-2 ${isMobile ? 'overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide' : 'shrink-0'}`}>
              {authorInfo && viewingLineup.sourceLink && (
                authorInfo.uid ? (
                  <a
                    href={
                      authorInfo.uid.startsWith('MS4')
                        ? `https://www.douyin.com/user/${authorInfo.uid}`
                        : `https://space.bilibili.com/${authorInfo.uid}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white hover:border-[#ff4655] hover:text-[#ff4655] transition-colors whitespace-nowrap"
                  >
                    <img src={authorInfo.avatar} className="w-5 h-5 rounded-full" alt={authorInfo.name} referrerPolicy="no-referrer" />
                    <span>{authorInfo.name}</span>
                  </a>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white whitespace-nowrap">
                    <img src={authorInfo.avatar} className="w-5 h-5 rounded-full" alt={authorInfo.name} referrerPolicy="no-referrer" />
                    <span>{authorInfo.name}</span>
                  </div>
                )
              )}
              {isLoadingAuthor && (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-gray-400 whitespace-nowrap">
                  <Icon name="Loader" size={14} className="animate-spin" /> 加载中...
                </div>
              )}
              {viewingLineup.sourceLink && (
                <a
                  href={viewingLineup.sourceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white hover:border-[#ff4655] hover:text-[#ff4655] transition-colors whitespace-nowrap"
                >
                  <Icon name="Play" size={14} /> 精准空降
                </a>
              )}
              {!handleCopyShared && !isGuest && !isMobile && (
                <button
                  type="button"
                  onClick={() => handleEditStart(viewingLineup)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white hover:border-[#ff4655] hover:text-[#ff4655] transition-colors whitespace-nowrap"
                  title="编辑"
                >
                  <Icon name="Pencil" size={14} /> 编辑
                </button>
              )}
              {!handleCopyShared && !isGuest && !isAdmin && onSubmitLineup && (
                <button
                  type="button"
                  onClick={() => onSubmitLineup(viewingLineup.id)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-purple-500/50 bg-purple-500/10 text-sm text-purple-300 hover:border-purple-400 hover:text-purple-200 transition-colors whitespace-nowrap"
                  title="投稿此点位"
                >
                  <Icon name="Send" size={14} /> 投稿
                </button>
              )}
              {handleCopyShared && !isMobile && (
                <button
                  type="button"
                  onClick={() => handleCopyShared(viewingLineup)}
                  disabled={isSavingShared}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-500/50 bg-emerald-500/10 text-sm text-emerald-300 hover:border-emerald-400 hover:text-emerald-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                  title="下载点位包"
                >
                  <Icon name="Download" size={14} /> {isSavingShared ? '下载中...' : '下载'}
                </button>
              )}
              {handleSaveToPersonal && !isMobile && (
                <button
                  type="button"
                  onClick={async () => {
                    const started = await handleSaveToPersonal(viewingLineup);
                    if (started && typeof started === 'boolean') {
                      onClose();
                    }
                  }}
                  disabled={isSavingToPersonal}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${isSavingToPersonal
                    ? 'bg-blue-500/50 cursor-not-allowed disabled:opacity-60'
                    : 'border border-yellow-500/50 bg-yellow-500/10 text-yellow-300 hover:border-yellow-400 hover:text-yellow-200 hover:bg-yellow-500/20'
                    }`}
                  title="保存到个人库"
                >
                  <Icon name="Save" size={14} /> {isSavingToPersonal ? '保存中...' : '保存'}
                </button>
              )}
              {!isMobile && (
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#ff4655]/60 bg-[#ff4655]/10 text-sm text-white hover:bg-[#ff4655]/20 hover:border-[#ff4655] transition-colors whitespace-nowrap"
                  title="关闭"
                >
                  <Icon name="X" size={14} /> 关闭
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#181b1f]">
          <div className={`grid gap-4 md:gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {imageItems.map((item, idx) =>
              item.src ? (
                <div key={idx} className="flex flex-col gap-2">
                  <div
                    className={`relative group cursor-zoom-in aspect-video bg-[#0f1923] rounded-lg overflow-hidden border border-white/10 transition-colors ${!isMobile ? 'hover:border-[#ff4655]/70' : 'active:border-[#ff4655]/70'
                      }`}
                    onClick={() =>
                      setViewingImage({
                        src: item.src,
                        list: imageList,
                        index: imageList.indexOf(item.src),
                      })
                    }
                  >
                    <img src={item.src} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/15 to-transparent pointer-events-none" />
                    <div className="absolute inset-x-0 top-0 p-3 flex items-center gap-2 text-white font-bold text-base drop-shadow pointer-events-none">
                      <Icon name="Image" size={16} className="text-[#ff4655]" /> {item.label}
                    </div>
                    {item.desc && (
                      <div className="absolute inset-x-0 bottom-0 pointer-events-none">
                        <div className="text-sm text-gray-100 leading-snug max-h-20 overflow-hidden px-3 py-2 rounded-b-md rounded-t-none bg-black/40 backdrop-blur-sm border border-white/10 shadow shadow-black/40">
                          {item.desc}
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Icon name="Maximize2" className="text-white" />
                    </div>
                  </div>
                </div>
              ) : null,
            )}
          </div>
          {!viewingLineup.standImg &&
            !viewingLineup.stand2Img &&
            !viewingLineup.aimImg &&
            !viewingLineup.aim2Img &&
            !viewingLineup.landImg && (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">暂无图片资料</div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ViewerModal;
