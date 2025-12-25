/**
 * AdminAccessDenied - 访问拒绝页面
 * 
 * 职责：
 * - 当非法用户尝试进入后台或权限不足时显示
 * - 提供返回首页或重新登录的引导
 */
import React from 'react';
import Icon from '../../../components/Icon';

interface Props {
    email?: string;
    onLogout: () => void;
}

/**
 * 无权限访问提示组件
 */
function AdminAccessDenied({ email, onLogout }: Props) {
    return (
        <div className="min-h-screen bg-[#0f1923] flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center">
                {/* 图标 */}
                <div className="w-24 h-24 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center">
                    <Icon name="ShieldX" size={48} className="text-red-400" />
                </div>

                {/* 标题 */}
                <h1 className="text-2xl font-bold text-white mb-3">
                    暂无访问权限
                </h1>

                {/* 说明 */}
                <p className="text-gray-400 mb-6 leading-relaxed">
                    当前账号 <span className="text-white font-medium">{email}</span> 没有管理后台的访问权限。
                    <br />
                    如需获取权限，请联系超级管理员。
                </p>

                {/* 分隔线 */}
                <div className="h-px bg-white/10 my-6" />

                {/* 操作按钮 */}
                <div className="flex flex-col gap-3">
                    <a
                        href="/shared.html"
                        className="w-full py-3 px-4 bg-[#ff4655] hover:bg-[#ff5a67] text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        <Icon name="Globe" size={18} />
                        前往共享库
                    </a>
                    <button
                        onClick={onLogout}
                        className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-medium rounded-xl transition-colors border border-white/10 flex items-center justify-center gap-2"
                    >
                        <Icon name="LogOut" size={18} />
                        退出登录
                    </button>
                </div>

                {/* 底部提示 */}
                <p className="mt-8 text-xs text-gray-600">
                    管理后台仅对授权管理员开放
                </p>
            </div>
        </div>
    );
}

export default AdminAccessDenied;
