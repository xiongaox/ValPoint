// @ts-nocheck
import React from 'react';
import Icon from './Icon';

const fields = [
  { k: 'stand', l: '站位图' },
  { k: 'aim', l: '瞄点图' },
  { k: 'aim2', l: '瞄点图2' },
  { k: 'land', l: '技能落点' },
];

const EditorModal = ({ isEditorOpen, setIsEditorOpen, editingLineupId, newLineupData, setNewLineupData, handleEditorSave }) => {
  if (!isEditorOpen) return null;
  return (
    <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="modal-content bg-[#1f2326] w-full max-w-3xl h-[85vh] flex flex-col rounded-xl border border-white/10 shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-[#252a30]">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
            <Icon name="FileText" className="text-[#ff4655]" /> {editingLineupId ? '编辑图文策略' : '新增图文策略'}
          </h2>
          <button onClick={() => setIsEditorOpen(false)} className="text-gray-400 hover:text-white">
            <Icon name="X" size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-2">标题 (Title)</label>
            <input
              className="w-full bg-[#0f1923] border border-gray-700 rounded p-3 text-white focus:border-[#ff4655] outline-none"
              placeholder="例如：B区窗户进攻瞬爆烟"
              value={newLineupData.title}
              onChange={(e) => setNewLineupData({ ...newLineupData, title: e.target.value })}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            {fields.map((field) => (
              <div key={field.k} className="bg-[#181b1f] p-4 rounded border border-white/5">
                <div className="text-[#ff4655] font-bold text-sm mb-3 flex items-center gap-2 uppercase tracking-wider">
                  <Icon name="Image" size={14} /> {field.l}
                </div>
                <input
                  className="w-full bg-[#0f1923] border border-gray-700 rounded p-2 text-xs text-white focus:border-[#ff4655] outline-none mb-2"
                  placeholder="图片链接 (https://...)"
                  value={newLineupData[field.k + 'Img'] || ''}
                  onChange={(e) => setNewLineupData({ ...newLineupData, [field.k + 'Img']: e.target.value })}
                />
                <div className="h-32 bg-[#0f1923] rounded border border-gray-800 flex items-center justify-center overflow-hidden mb-2">
                  {newLineupData[field.k + 'Img'] ? (
                    <img src={newLineupData[field.k + 'Img']} className="w-full h-full object-cover" onError={(e) => (e.target.style.display = 'none')} />
                  ) : (
                    <span className="text-xs text-gray-600">预览区域</span>
                  )}
                </div>
                <textarea
                  className="w-full bg-[#0f1923] border border-gray-700 rounded p-2 text-xs text-white focus:border-[#ff4655] outline-none resize-none h-16"
                  placeholder={`${field.l}说明...`}
                  value={newLineupData[field.k + 'Desc'] || ''}
                  onChange={(e) => setNewLineupData({ ...newLineupData, [field.k + 'Desc']: e.target.value })}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 border-t border-white/10 bg-[#252a30] flex justify-end gap-3">
          <button onClick={() => setIsEditorOpen(false)} className="px-6 py-2 rounded bg-transparent hover:bg-white/5 text-gray-400 font-bold transition-colors">
            取消
          </button>
          <button onClick={handleEditorSave} className="px-8 py-2 rounded bg-[#ff4655] hover:bg-[#d93a49] text-white font-bold transition-colors shadow-lg">
            确认保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorModal;
