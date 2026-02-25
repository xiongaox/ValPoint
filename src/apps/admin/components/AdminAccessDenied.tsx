/**
 * AdminAccessDenied - 应用壳层(admin)
 *
 * 模块定位：
 * - 所在层级：应用壳层(admin)
 * - 主要目标：承载管理后台流程与页面路由
 *
 * 关键职责：
 * - 聚焦界面渲染与交互事件回调
 * - 接收上层 props 并输出稳定 UI 行为
 * - 避免在组件中堆积跨模块业务逻辑
 *
 * 主要导出：
 * - `default:AdminAccessDenied`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`../../../components/Icon`
 * - 下游影响：供 admin.html 入口挂载
 */

import React from 'react';
import Icon from '../../../components/Icon';

interface Props {
    email?: string;
    onLogout: () => void;
}

function AdminAccessDenied({ email, onLogout }: Props) {
    return (
        <div className="min-h-screen bg-[#0f1923] flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center">
                    <Icon name="ShieldX" size={48} className="text-red-400" />
                </div>

                <h1 className="text-2xl font-bold text-white mb-3">
                    暂无访问权限
                </h1>

                <p className="text-gray-400 mb-6 leading-relaxed">
                    当前账号 <span className="text-white font-medium">{email}</span> 没有管理后台的访问权限。
                    <br />
                    如需获取权限，请联系超级管理员。
                </p>

                <div className="h-px bg-white/10 my-6" />

                <div className="flex flex-col gap-3">
                    <a
                        href="/"
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

                <p className="mt-8 text-xs text-gray-600">
                    管理后台仅对授权管理员开放
                </p>
            </div>
        </div>
    );
}

export default AdminAccessDenied;
