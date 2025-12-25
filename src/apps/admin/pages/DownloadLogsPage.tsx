/**
 * DownloadLogsPage - 下载记录审计页
 * 
 * 职责：
 * - 列表展示所有用户的点位下载行为日志
 * - 支持按地图、特工、时间及用户名搜索审计记录
 */
import React, { useState, useEffect } from 'react';
import Icon from '../../../components/Icon';

interface DownloadLog {
    id: string;
    userEmail: string;
    lineupTitle: string;
    mapName: string;
    agentName: string;
    downloadedAt: string;
}

/**
 * 下载日志页面
 */
function DownloadLogsPage() {
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');

    // TODO: 从 Supabase 加载真实数据
    const mockLogs: DownloadLog[] = [
        {
            id: '1',
            userEmail: 'user1@gmail.com',
            lineupTitle: '亚海悬城_不死鸟_技能Q',
            mapName: 'Abyss',
            agentName: 'Phoenix',
            downloadedAt: '2024-12-22 19:30:00',
        },
        {
            id: '2',
            userEmail: 'user2@qq.com',
            lineupTitle: '荒漠山城_雷霆_技能E',
            mapName: 'Bind',
            agentName: 'Sova',
            downloadedAt: '2024-12-22 18:45:00',
        },
        {
            id: '3',
            userEmail: 'test@163.com',
            lineupTitle: '冰川城_零_技能C',
            mapName: 'Icebox',
            agentName: 'Viper',
            downloadedAt: '2024-12-22 17:20:00',
        },
    ];

    return (
        <div className="space-y-6">
            {/* 筛选栏 */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    {(['today', 'week', 'month'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${dateRange === range
                                ? 'bg-[#ff4655] text-white'
                                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            {range === 'today' ? '今天' : range === 'week' ? '本周' : '本月'}
                        </button>
                    ))}
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm rounded-lg transition-colors">
                    <Icon name="Download" size={16} />
                    导出日志
                </button>
            </div>

            {/* 日志表格 */}
            <div className="bg-[#1f2326] rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                用户
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                点位
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                地图
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                特工
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                下载时间
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {mockLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <span className="text-sm text-white">{log.userEmail}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-white">{log.lineupTitle}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-gray-400">{log.mapName}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-gray-400">{log.agentName}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-gray-500">{log.downloadedAt}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 统计信息 */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#1f2326] rounded-xl border border-white/10 p-4">
                    <div className="text-2xl font-bold text-white">89</div>
                    <div className="text-sm text-gray-400">今日下载</div>
                </div>
                <div className="bg-[#1f2326] rounded-xl border border-white/10 p-4">
                    <div className="text-2xl font-bold text-white">523</div>
                    <div className="text-sm text-gray-400">本周下载</div>
                </div>
                <div className="bg-[#1f2326] rounded-xl border border-white/10 p-4">
                    <div className="text-2xl font-bold text-white">2,156</div>
                    <div className="text-sm text-gray-400">本月下载</div>
                </div>
            </div>
        </div>
    );
}

export default DownloadLogsPage;
