// @ts-nocheck
/**
 * DeleteConfirmModal - 删除确认模态框
 * 
 * 用于确认删除单个点位数据。
 */
import React from 'react';
import Icon from './Icon';

const DeleteConfirmModal = ({ deleteTargetId, onCancel, onConfirm }) => {
  if (!deleteTargetId) return null;
  return (
    <div className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#181b1f]/95 shadow-2xl shadow-black/50 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#1c2028]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ff4655]/15 border border-[#ff4655]/35 flex items-center justify-center text-[#ff4655]">
              <Icon name="AlertTriangle" size={22} />
            </div>
            <div className="flex flex-col leading-tight">
              <h3 className="text-xl font-bold text-white">确认删除点位</h3>
              <span className="text-[11px] uppercase tracking-[0.15em] text-gray-500">安全操作</span>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors"
            aria-label="关闭"
          >
            <Icon name="X" size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 bg-[#181b1f]">
          <div className="rounded-lg border border-[#ff4655]/25 bg-[#ff4655]/10 px-4 py-3 text-sm text-[#ffc6cc] flex items-start gap-2">
            <Icon name="Info" size={16} className="mt-[2px]" />
            <div className="space-y-1">
              <div className="font-semibold text-white">删除后不可恢复</div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm font-semibold text-gray-200 hover:border-white/30 hover:text-white transition-colors"
            >
              取消
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#ff5b6b] to-[#ff3c4d] hover:from-[#ff6c7b] hover:to-[#ff4c5e] shadow-md shadow-red-900/30 transition-all"
            >
              确认删除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
