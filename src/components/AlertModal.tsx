// @ts-nocheck
import React from 'react';
import Icon from './Icon';

const AlertModal = ({ message, onClose }) => {
  if (!message) return null;
  return (
    <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="modal-content bg-[#1f2326] border-l-4 border-[#ff4655] p-6 rounded shadow-2xl max-w-sm w-full">
        <div className="flex items-start gap-4">
          <div className="text-[#ff4655] mt-1">
            <Icon name="Info" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-2">提示</h3>
            <p className="text-gray-300 text-sm whitespace-pre-line">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
