/**
 * ChangelogModal - 组件层
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
 * - `default:ChangelogModal`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`./Icon`、`../changelog`、`../hooks/useEscapeClose`
 * - 下游影响：供页面与应用壳组合
 */

import React from 'react';
import Icon from './Icon';
import { changelogEntries } from '../changelog';
import { useEscapeClose } from '../hooks/useEscapeClose';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const ChangelogModal: React.FC<Props> = ({ isOpen, onClose }) => {
  useEscapeClose(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="w-full max-w-lg bg-[#1f2326] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4">
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
        <div className="space-y-3 text-sm text-gray-200 leading-relaxed max-h-[50vh] overflow-y-auto pr-1">
          {changelogEntries.slice(0, 3).map((entry) => (
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
        {changelogEntries.length > 3 && (
          <div className="pt-2 border-t border-white/10">
            <a
              href="/wiki/guide/更新日志.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:border-white/30 transition-colors text-sm"
            >
              <Icon name="ExternalLink" size={14} />
              查看完整更新日志
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangelogModal;
