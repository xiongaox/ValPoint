/**
 * ChangelogModal - 更新日志展示模态框
 * 
 * 从本地数据汇总并展示应用的历史更新记录。
 */
import React from 'react';
import Icon from './Icon';
import { changelogEntries } from '../changelog';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const ChangelogModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#1f2326] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="History" className="text-[#ff4655]" />
            <h3 className="text-xl font-bold text-white">更新日志</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/40 transition-colors"
          >
            <Icon name="X" size={16} />
          </button>
        </div>
        <div className="space-y-3 text-sm text-gray-200 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
          {changelogEntries.map((entry) => (
            <div key={entry.date} className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
              <div className="text-[#ff4655] text-xs font-bold uppercase tracking-wider">{entry.date}</div>
              <ul className="list-disc list-inside space-y-1 text-gray-100">
                {entry.items.map((item, idx) => {
                  if (typeof item === 'string') {
                    return <li key={idx}>{item}</li>;
                  }
                  return (
                    <li key={idx}>
                      {item.text}
                      {item.children && item.children.length > 0 && (
                        <ul className="list-disc list-inside pl-4 space-y-1 text-gray-300">
                          {item.children.map((child, cidx) => (
                            <li key={cidx}>{child}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChangelogModal;
