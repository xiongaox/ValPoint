/**
 * Select - 自定义下拉选择组件
 * 
 * 职责：
 * - 提供统一的暗色主题下拉菜单样式
 * - 支持图标、占位符及选中状态显示
 * - 替代原生 select 元素以提升 UI 美观度
 */
import React, { useState, useRef, useEffect } from 'react';
import Icon, { IconName } from './Icon';

export interface SelectOption {
    label: string;
    value: string;
}

interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    icon?: IconName;
    className?: string;
}

const Select: React.FC<SelectProps> = ({
    value,
    onChange,
    options,
    placeholder = '请选择',
    icon,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // 点击外部关闭
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
    };

    return (
        <div
            className={`relative min-w-[140px] ${className}`}
            ref={containerRef}
        >
            {/* 触发器按钮 */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all border ${isOpen || value
                        ? 'bg-[#ff4655]/10 border-[#ff4655]/30 text-white'
                        : 'bg-[#0f1923] border-white/10 hover:border-white/20 text-gray-400 hover:text-gray-300'
                    }`}
            >
                {icon && (
                    <Icon
                        name={icon}
                        size={16}
                        className={value || isOpen ? 'text-[#ff4655]' : 'text-gray-500'}
                    />
                )}

                <span className={`text-sm flex-1 truncate ${value ? 'text-white' : ''}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>

                <Icon
                    name="ChevronDown"
                    size={14}
                    className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </div>

            {/* 下拉菜单 */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1f2326] border border-white/10 rounded-lg shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-100 max-h-60 overflow-y-auto custom-scrollbar">
                    <div className="p-1">
                        {/* 默认选项 (全部) */}
                        <div
                            onClick={() => handleSelect('')}
                            className={`px-3 py-2 rounded-md text-sm cursor-pointer transition-colors ${value === ''
                                    ? 'bg-[#ff4655]/10 text-[#ff4655]'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            {placeholder}
                        </div>

                        {options.map((option) => (
                            <div
                                key={option.value}
                                onClick={() => handleSelect(option.value)}
                                className={`px-3 py-2 rounded-md text-sm cursor-pointer transition-colors ${value === option.value
                                        ? 'bg-[#ff4655]/10 text-[#ff4655]'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                {option.label}
                            </div>
                        ))}

                        {options.length === 0 && (
                            <div className="px-3 py-2 text-sm text-gray-600 text-center">
                                无选项
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Select;
