/**
 * SharedFilterModal - 共享库贡献者筛选模态框
 * 
 * 用于在查看共享库时，根据贡献者的 ID 或昵称进行数据过滤。
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
      className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#1c2228] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#ff4655]/15 text-[#ff4655] flex items-center justify-center">
              <Icon name="Filter" size={16} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">筛选共享</h3>
              <p className="text-sm text-gray-400">选择要查看的共享者，或显示全部。</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/40 transition-colors"
          >
            <Icon name="X" size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <label className="text-xs text-gray-400 uppercase tracking-wider">选择共享者</label>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen((v) => !v)}
              className="w-full h-12 bg-[#0f141a] border border-white/15 rounded-lg pl-4 pr-4 text-sm text-white text-left focus:outline-none focus:ring-2 focus:ring-[#ff4655]/60 focus:border-[#ff4655]/60 transition-all shadow-inner flex items-center justify-between"
            >
              <span className="truncate">{pendingUserId === '*ALL*' ? '全部共享者' : pendingUserId}</span>
              <Icon name="ChevronDown" size={16} className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-[#0f141a] border border-white/15 rounded-lg shadow-2xl max-h-56 overflow-auto z-10">
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

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-200 bg-white/5 hover:bg-white/10 transition-colors"
            >
              重置
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#ff4655] hover:bg-[#d93a49] transition-colors"
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
