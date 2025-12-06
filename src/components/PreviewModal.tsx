// @ts-nocheck
import React from 'react';

const PreviewModal = ({ isOpen, previewInput, setPreviewInput, onClose, onSubmit }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="modal-content bg-[#1f2326] border-l-4 border-[#ff4655] p-6 rounded shadow-2xl max-w-md w-full">
        <h3 className="text-lg font-bold text-white mb-4">加载分享点位</h3>
        <input
          className="w-full bg-[#0f1923] border border-gray-600 rounded p-3 text-white focus:border-[#ff4655] outline-none mb-4"
          placeholder="粘贴分享链接或ID..."
          value={previewInput}
          onChange={(e) => setPreviewInput(e.target.value)}
        />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded bg-transparent hover:bg-white/5 text-gray-400 text-sm font-bold transition-colors">
            取消
          </button>
          <button onClick={onSubmit} className="px-6 py-2 rounded bg-[#ff4655] hover:bg-[#d93a49] text-white text-sm font-bold transition-colors">
            加载预览
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
