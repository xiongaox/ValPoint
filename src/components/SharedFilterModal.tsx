/**
 * SharedFilterModal - 共享库贡献者筛选模态框
 * 
 * 用于在查看共享库时，根据贡献者的 ID 或昵称进行数据过滤。
 * 样式与 UserProfileModal 保持一致。
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon';

type Props = {
  isOpen: boolean;
  contributors: string[];
  selectedUserId: string | null;
  onSelect: (userId: string | null) => void;
  onClose: () => void;
};

const SharedFilterModal: React.FC<Props> = ({ isOpen, contributors, selectedUserId, onSelect, onClose }) => {
  if (!isOpen) return null;

  const options = useMemo(() => {
    const uniq = Array.from(new Set(contributors));
    return ['*ALL*', ...uniq];
  }, [contributors]);
  const [pendingUserId, setPendingUserId] = useState<string>(selectedUserId ?? '*ALL*');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const handleApply = () => {
    onSelect(pendingUserId === '*ALL*' ? null : pendingUserId);
    onClose();
  };

  const handleReset = () => {
    setPendingUserId('*ALL*');
    onSelect(null);
    onClose();
  };

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  return (
    <div
      className="fixed inset-0 z-[1400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#181b1f]/95 shadow-2xl shadow-black/50 overflow-hidden">
        {/* Header - 与 UserProfileModal 一致 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#1c2028]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ff4655]/15 border border-[#ff4655]/35 flex items-center justify-center text-[#ff4655]">
              <Icon name="Filter" size={18} />
            </div>
            <div className="leading-tight">
              <div className="text-xl font-bold text-white">筛选共享</div>
              <div className="text-xs text-gray-500">选择要查看的共享者，或显示全部</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors"
            aria-label="关闭"
          >
            <Icon name="X" size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 bg-[#181b1f]">
          {/* 选择共享者 */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">选择共享者</label>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen((v) => !v)}
                className="w-full h-11 bg-[#0f131a] border border-white/10 rounded-lg pl-4 pr-4 text-base text-white text-left focus:outline-none focus:border-[#ff4655] transition-all flex items-center justify-between"
              >
                <span className="truncate">{pendingUserId === '*ALL*' ? '全部共享者' : pendingUserId}</span>
                <Icon name="ChevronDown" size={16} className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isDropdownOpen && (
                <div className="absolute left-0 right-0 mt-2 bg-[#0f131a] border border-white/10 rounded-lg shadow-2xl max-h-56 overflow-auto z-10">
                  {options.map((id) => (
                    <button
                      key={id}
                      onClick={() => {
                        setPendingUserId(id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${pendingUserId === id ? 'bg-[#ff4655]/20 text-white' : 'text-gray-200 hover:bg-white/5'
                        }`}
                    >
                      {id === '*ALL*' ? '全部共享者' : id}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!contributors.length && <div className="text-sm text-gray-500 text-center py-2">暂无可筛选的共享者</div>}
          </div>

          {/* Actions - 与 UserProfileModal 一致 */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg border border-white/15 text-sm text-gray-200 hover:border-white/40 hover:bg-white/5 transition-colors"
            >
              重置
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#ff5b6b] to-[#ff3c4d] hover:from-[#ff6c7b] hover:to-[#ff4c5e] text-white font-semibold text-sm transition-colors shadow-md shadow-red-900/30"
            >
              应用
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedFilterModal;
