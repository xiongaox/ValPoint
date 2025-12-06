// @ts-nocheck
import React from 'react';
import Icon from './Icon';

const DeleteConfirmModal = ({ deleteTargetId, onCancel, onConfirm }) => {
  if (!deleteTargetId) return null;
  return (
    <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="modal-content bg-[#1f2326] border-l-4 border-[#ff4655] p-6 rounded shadow-2xl max-w-sm w-full text-center">
        <div className="mx-auto w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4 text-[#ff4655]">
          <Icon name="AlertTriangle" size={24} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">确认删除?</h3>
        <p className="text-gray-400 text-sm mb-6">此操作无法撤销。</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onCancel} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold transition-colors">
            取消
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded bg-[#ff4655] hover:bg-[#d93a49] text-white text-sm font-bold transition-colors">
            确认删除
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
