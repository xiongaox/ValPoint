/**
 * PreviewModal - 组件层
 *
 * 模块定位：
 * - 所在层级：组件层
 * - 主要目标：承载界面渲染与事件分发
 *
 * 关键职责：
 * - 聚焦界面渲染与交互事件回调
 * - 接收上层 props 并输出稳定 UI 行为
 * - 避免在组件中堆积跨模块业务逻辑
 *
 * 主要导出：
 * - `default:PreviewModal`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`../hooks/useEscapeClose`
 * - 下游影响：供页面与应用壳组合
 */

// @ts-nocheck
import React from 'react';
import { useEscapeClose } from '../hooks/useEscapeClose';

const PreviewModal = ({ isOpen, previewInput, setPreviewInput, onClose, onSubmit }) => {
  useEscapeClose(isOpen, onClose);

  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
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
