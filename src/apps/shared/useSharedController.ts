/**
 * useSharedController - 共享库控制器
 * 
 * 职责：
 * - 管理共享库的全部交互状态（地图、特工、筛选、点位列表）
 * - 处理点位打包下载逻辑 (需登录)
 * - 与 Supabase 服务层交互获取公共点位数据 (SharedLineups)
 */
import { useState, useCallback, useMemo, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { useValorantData } from '../../hooks/useValorantData';
import { useMapInfo } from '../../features/lineups/controllers/useMapInfo';
import { fetchSharedList } from '../../services/shared';
import { BaseLineup, SharedLineup, AgentOption, MapOption, NewLineupForm } from '../../types/lineup';
import { downloadLineupBundle } from '../../lib/lineupDownload';
import { checkDailyDownloadLimit, incrementDownloadCount, logDownload } from '../../lib/downloadLimit';
import { MAP_TRANSLATIONS } from '../../constants/maps';

interface UseSharedControllerParams {
    user: User | null; // 可选，支持游客模式
    setAlertMessage: (msg: string | null) => void;
    setViewingImage: (img: { src: string; list?: string[]; index?: number } | null) => void;
    onRequestLogin: () => void; // 下载时请求登录
}

export function useSharedController({ user, setAlertMessage, setViewingImage, onRequestLogin }: UseSharedControllerParams) {
    // 地图数据
    const { maps, agents } = useValorantData();

    // 状态
    const [selectedMap, setSelectedMapState] = useState<MapOption | null>(null);
    const [selectedAgent, setSelectedAgent] = useState<AgentOption | null>(null);
    const [selectedAbilityIndex, setSelectedAbilityIndex] = useState<number | null>(null);
    const [selectedSide, setSelectedSide] = useState<'all' | 'attack' | 'defense'>('attack');
    const [searchQuery, setSearchQuery] = useState('');
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [selectedLineupId, setSelectedLineupId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lineups, setLineups] = useState<BaseLineup[]>([]);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    // 点位详情弹窗
    const [viewingLineup, setViewingLineup] = useState<BaseLineup | null>(null);
    // 共享者筛选
    const [selectedSharedUserId, setSelectedSharedUserId] = useState<string | null>(null);
    // 下载状态
    const [isDownloading, setIsDownloading] = useState(false);

    // 新增点位数据（用于地图交互，但共享库不允许创建）
    const [newLineupData, setNewLineupData] = useState<NewLineupForm>({
        title: '',
        agentPos: null,
        skillPos: null,
        standImg: '',
        standDesc: '',
        stand2Img: '',
        stand2Desc: '',
        aimImg: '',
        aimDesc: '',
        aim2Img: '',
        aim2Desc: '',
        landImg: '',
        landDesc: '',
        sourceLink: '',
        authorName: '',
        authorAvatar: '',
        authorUid: '',
        enableStand2: false,
        enableAim2: false,
    });
    const [placingType, setPlacingType] = useState<'agent' | 'skill' | null>(null);

    // 创建地图名称中英对照表
    const mapNameZhToEn = useMemo<Record<string, string>>(() => {
        const reverse: Record<string, string> = {};
        Object.entries(MAP_TRANSLATIONS).forEach(([en, zh]) => {
            reverse[zh] = en;
        });
        return reverse;
    }, []);

    // 获取选中的点位
    const selectedLineup = useMemo(() => {
        return lineups.find((l) => l.id === selectedLineupId) || null;
    }, [lineups, selectedLineupId]) as SharedLineup | null;

    // 使用 useMapInfo 获取地图相关方法
    const { getMapDisplayName, getMapEnglishName, getMapUrl, getMapCoverUrl } = useMapInfo({
        selectedMap,
        selectedSide,
    });

    // 初始化默认地图（使用列表第一个）
    useEffect(() => {
        if (maps.length > 0 && !selectedMap) {
            setSelectedMapState(maps[0]);
        }
    }, [maps, selectedMap]);

    // 标记是否已完成首次英雄初始化
    const [hasInitializedAgent, setHasInitializedAgent] = useState(false);

    // 首次加载时默认选择第一个英雄，但用户点击"显示全部"后不再自动选择
    useEffect(() => {
        if (agents.length > 0 && !selectedAgent && !hasInitializedAgent) {
            setSelectedAgent(agents[0]);
            setHasInitializedAgent(true);
        }
    }, [agents, selectedAgent, hasInitializedAgent]);

    // 加载共享库点位
    const loadLineups = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await fetchSharedList(mapNameZhToEn);
            setLineups(data || []);
        } catch (err) {
            console.error('加载共享点位失败:', err);
            setAlertMessage('加载点位失败');
        } finally {
            setIsLoading(false);
        }
    }, [mapNameZhToEn, setAlertMessage]);

    // 初次加载
    useEffect(() => {
        loadLineups();
    }, [loadLineups]);

    // 手动过滤点位（包括共享者筛选）
    const filteredLineups = useMemo(() => {
        if (!selectedMap) return [];
        const mapKey = selectedMap.displayName;
        const mapKeyEn = mapNameZhToEn[mapKey] || mapKey;

        return lineups.filter((l) => {
            const mapMatch = l.mapName === mapKey || l.mapName === mapKeyEn;
            const agentMatch = !selectedAgent || l.agentName === selectedAgent.displayName;
            const sideMatch = selectedSide === 'all' || l.side === selectedSide;
            const abilityMatch = selectedAbilityIndex === null || l.abilityIndex === selectedAbilityIndex;
            const searchMatch = !searchQuery || l.title.toLowerCase().includes(searchQuery.toLowerCase());
            // 共享者筛选
            const userMatch = !selectedSharedUserId || l.userId === selectedSharedUserId;
            return mapMatch && agentMatch && sideMatch && abilityMatch && searchMatch && userMatch;
        });
    }, [lineups, selectedMap, selectedAgent, selectedSide, selectedAbilityIndex, searchQuery, selectedSharedUserId, mapNameZhToEn]);

    // 获取所有共享者列表
    const contributors = useMemo(() => {
        const userIds = lineups.map((l) => l.userId).filter(Boolean) as string[];
        return Array.from(new Set(userIds));
    }, [lineups]);

    // 计算每个特工的点位数量
    const agentCounts = useMemo(() => {
        if (!selectedMap) return {};
        const mapKey = selectedMap.displayName;
        const mapKeyEn = mapNameZhToEn[mapKey] || mapKey;
        const counts: Record<string, number> = {};

        lineups.forEach((l) => {
            if (l.mapName !== mapKey && l.mapName !== mapKeyEn) return;
            counts[l.agentName] = (counts[l.agentName] || 0) + 1;
        });
        return counts;
    }, [lineups, selectedMap, mapNameZhToEn]);

    // 获取地图 URL（需要依赖 selectedSide 以便攻防切换时更新）
    const mapIcon = useMemo(() => {
        return getMapUrl();
    }, [getMapUrl, selectedSide]);

    const mapCover = useMemo(() => {
        return getMapCoverUrl();
    }, [getMapCoverUrl, selectedSide]);

    // 选择地图
    const handleSelectMap = useCallback((map: MapOption) => {
        setSelectedMapState(map);
        setSelectedLineupId(null);
        // 切换地图时自动选择默认特工（第一个）
        if (agents.length > 0) {
            setSelectedAgent(agents[0]);
        } else {
            setSelectedAgent(null);
        }
        setIsMapModalOpen(false);
    }, [agents]);

    // 查看点位详情（打开弹窗）
    const handleViewLineup = useCallback((id: string) => {
        setSelectedLineupId(id);
        const lineup = lineups.find((l) => l.id === id);
        if (lineup) {
            setViewingLineup(lineup);
        }
    }, [lineups]);

    // 关闭点位详情弹窗（同时清除选中状态）
    const handleViewerClose = useCallback(() => {
        setViewingLineup(null);
        setSelectedLineupId(null);  // 清除选中，消除蚂蚁线连接
    }, []);

    // 下载点位 - 需要登录，下载 ZIP 包
    const handleDownload = useCallback(async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();

        // 检查是否登录
        if (!user) {
            setAlertMessage('下载点位需要登录，请先登录');
            onRequestLogin();
            return;
        }

        const target = lineups.find((l) => l.id === id);
        if (!target) return;

        if (isDownloading) return;

        // 检查下载限制
        const { allowed, limit, remaining } = await checkDailyDownloadLimit(user.id);
        if (!allowed) {
            setAlertMessage(`今日下载次数已达上限 (${limit}次)，请明天再试`);
            return;
        }

        try {
            setIsDownloading(true);
            setAlertMessage('正在打包点位数据，请稍候...');

            const result = await downloadLineupBundle(target);

            // 记录下载次数和日志
            await incrementDownloadCount(user.id);
            await logDownload({
                userId: user.id,
                userEmail: user.email || '',
                lineupId: target.id,
                lineupTitle: target.title,
                mapName: target.mapName, // SharedLineup 使用 mapName
                agentName: target.agentName, // SharedLineup 使用 agentName
            });

            if (result.failedImages.length > 0) {
                setAlertMessage('部分图片下载失败，但数据包已生成');
            } else {
                setAlertMessage('打包下载成功');
            }
        } catch (err) {
            console.error('下载失败', err);
            setAlertMessage('打包下载失败，请稍后重试');
        } finally {
            setIsDownloading(false);
        }
    }, [lineups, setAlertMessage, user, onRequestLogin, isDownloading]);

    return {
        // 状态
        isLoading,
        isDownloading,
        user,

        // 地图
        maps,
        selectedMap,
        setSelectedMap: handleSelectMap,
        isMapModalOpen,
        setIsMapModalOpen,
        mapIcon,
        mapCover,
        getMapDisplayName,
        getMapEnglishName,

        // 特工
        agents,
        selectedAgent,
        setSelectedAgent,
        selectedAbilityIndex,
        setSelectedAbilityIndex,
        agentCounts,

        // 筛选
        selectedSide,
        setSelectedSide,
        searchQuery,
        setSearchQuery,
        isFilterModalOpen,
        setIsFilterModalOpen,

        // 点位
        lineups,
        filteredLineups,
        selectedLineupId,
        setSelectedLineupId,
        selectedLineup,
        handleViewLineup,
        handleDownload,
        // 点位详情弹窗
        viewingLineup,
        setViewingLineup,
        handleViewerClose,
        // 共享者筛选
        contributors,
        selectedSharedUserId,
        setSelectedSharedUserId,

        // 地图交互（只读模式）
        newLineupData,
        setNewLineupData,
        placingType,
        // 适配器函数，将 string | null 转换为正确的类型
        setPlacingType: (val: string | null) => {
            setPlacingType(val as 'agent' | 'skill' | null);
        },

        // 图片查看
        setViewingImage,
    };
}
