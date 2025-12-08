// @ts-nocheck
import React from 'react';
import Icon from './Icon';

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
}) => {
  if (!isEditorOpen) return null;

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
                  className={`flex-1 justify-center flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    selectedSide === 'attack'
                      ? 'bg-gradient-to-r from-[#ff5b6b] to-[#ff3c4d] text-white shadow-lg shadow-red-900/30'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon name="Sword" size={16} /> 进攻 (ATK)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSide('defense')}
                  className={`flex-1 justify-center flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    selectedSide === 'defense'
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon name="Shield" size={16} /> 防守 (DEF)
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-2">点位来源链接 (可选)</label>
              <input
                className="w-full bg-[#0f1923] border border-[#2a323d] rounded-lg p-3 text-white focus:border-[#ff4655] outline-none transition-colors"
                placeholder="视频/来源链接，查看时可点击跳转"
                value={newLineupData.sourceLink || ''}
                onChange={(e) => setNewLineupData({ ...newLineupData, sourceLink: e.target.value })}
              />
            </div>
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
                  <input
                    className="w-full bg-[#0f1923] border border-[#2a323d] rounded p-2 text-white mb-2 focus:border-[#ff4655] outline-none"
                    placeholder="图片链接（可选）"
                    value={newLineupData[`${field.k}Img`]}
                    onChange={(e) => setNewLineupData({ ...newLineupData, [`${field.k}Img`]: e.target.value })}
                  />
                  <textarea
                    className="w-full bg-[#0f1923] border border-[#2a323d] rounded p-2 text-white h-16 resize-none overflow-y-auto focus:border-[#ff4655] outline-none"
                    placeholder="描述（可选）"
                    value={newLineupData[`${field.k}Desc`]}
                    onChange={(e) => setNewLineupData({ ...newLineupData, [`${field.k}Desc`]: e.target.value })}
                  />
                  {newLineupData[`${field.k}Img`] ? (
                    <div className="mt-3 relative overflow-hidden rounded border border-white/10 bg-[#0f1923]">
                      <img
                        src={newLineupData[`${field.k}Img`]}
                        alt={`${field.l} 预览`}
                        className="w-full h-40 object-cover"
                        onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                      />
                    </div>
                  ) : (
                    <div className="mt-3 h-40 flex items-center justify-center text-xs text-gray-600 border border-dashed border-[#2a323d] rounded bg-[#0f1923]">
                      暂无预览
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="p-5 border-t border-[#1b1f2a] flex justify-end gap-3 bg-[#1f2326]/90">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold transition-colors">
            取消
          </button>
          <button
            onClick={handleEditorSave}
            className="px-6 py-2 rounded bg-[#ff4655] hover:bg-[#d93a49] text-white text-sm font-bold transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorModal;
