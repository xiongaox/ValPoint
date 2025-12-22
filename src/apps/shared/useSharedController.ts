import { useState, useCallback, useMemo, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { useValorantData } from '../../hooks/useValorantData';
import { useMapInfo } from '../../features/lineups/controllers/useMapInfo';
import { fetchSharedList } from '../../services/shared';
import { BaseLineup, SharedLineup, AgentOption, MapOption, NewLineupForm } from '../../types/lineup';
import { MAP_TRANSLATIONS } from '../../constants/maps';



interface UseSharedControllerParams {
    user: User | null; // 可选，支持游客模式
    setAlertMessage: (msg: string | null) => void;
    setViewingImage: (img: { src: string; list?: string[]; index?: number } | null) => void;
    onRequestLogin: () => void; // 下载时请求登录
}

/**
 * 共享库控制器 Hook
 * 开放浏览模式，下载需要登录
 */
export function useSharedController({ user, setAlertMessage, setViewingImage, onRequestLogin }: UseSharedControllerParams) {
    // 地图数据
    const { maps, agents } = useValorantData();

    // 状态
    const [selectedMap, setSelectedMapState] = useState<MapOption | null>(null);
    const [selectedAgent, setSelectedAgent] = useState<AgentOption | null>(null);
    const [selectedAbilityIndex, setSelectedAbilityIndex] = useState<number | null>(null);
    const [selectedSide, setSelectedSide] = useState<'all' | 'attack' | 'defense'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [selectedLineupId, setSelectedLineupId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lineups, setLineups] = useState<BaseLineup[]>([]);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

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
        activeTab: 'view',
        sharedLineup: selectedLineup,
    });

    // 初始化默认地图（使用列表第一个）
    useEffect(() => {
        if (maps.length > 0 && !selectedMap) {
            setSelectedMapState(maps[0]);
        }
    }, [maps, selectedMap]);

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

    // 手动过滤点位
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
            return mapMatch && agentMatch && sideMatch && abilityMatch && searchMatch;
        });
    }, [lineups, selectedMap, selectedAgent, selectedSide, selectedAbilityIndex, searchQuery, mapNameZhToEn]);

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

    // 获取地图 URL
    const mapIcon = useMemo(() => {
        return getMapUrl();
    }, [getMapUrl]);

    const mapCover = useMemo(() => {
        return getMapCoverUrl();
    }, [getMapCoverUrl]);

    // 选择地图
    const handleSelectMap = useCallback((map: MapOption) => {
        setSelectedMapState(map);
        setSelectedLineupId(null);
        setSelectedAgent(null);
        setIsMapModalOpen(false);
    }, []);

    // 查看点位详情
    const handleViewLineup = useCallback((id: string) => {
        setSelectedLineupId(id);
    }, []);

    // 下载点位 - 需要登录
    const handleDownload = useCallback(async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();

        // 检查是否登录
        if (!user) {
            setAlertMessage('下载点位需要登录，请先登录');
            onRequestLogin();
            return;
        }

        // TODO: 实现下载功能和日志记录
        setAlertMessage('下载功能即将上线');
    }, [user, setAlertMessage, onRequestLogin]);

    return {
        // 状态
        isLoading,
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
