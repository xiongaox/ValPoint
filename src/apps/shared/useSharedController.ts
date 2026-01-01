/**
 * useSharedController - 共享库控制器
 *
 * 职责：
 * - 封装共享库控制器相关的状态与副作用。
 * - 对外提供稳定的接口与回调。
 * - 处理订阅、清理或缓存等生命周期细节。
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { useValorantData } from '../../hooks/useValorantData';
import { useMapInfo } from '../../features/lineups/controllers/useMapInfo';
import { fetchSharedList } from '../../services/shared';
import { BaseLineup, SharedLineup, AgentOption, MapOption, NewLineupForm } from '../../types/lineup';
import { downloadLineupBundle } from '../../lib/lineupDownload';
import { checkDailyDownloadLimit, incrementDownloadCount, logDownload } from '../../lib/downloadLimit';
import { MAP_TRANSLATIONS } from '../../constants/maps';
import { useIsMobile } from '../../hooks/useIsMobile';
import { createClient } from '@supabase/supabase-js';
import { getSubscriptionList } from './logic/subscription';
import { migrateLineupImages } from '../../services/imageMigrationService';
import { ImageBedConfig } from '../../types/imageBed';
import { getSystemSettings } from '../../lib/systemSettings';
import { saveLineupApi, findLineupByClone } from '../../services/lineups';
import { LineupDbPayload } from '../../types/lineup';


interface UseSharedControllerParams {
    user: User | null; // 说明：可选，支持游客模式。
    setAlertMessage: (msg: string | null) => void;
    setViewingImage: (img: { src: string; list?: string[]; index?: number } | null) => void;
    onRequestLogin: () => void; // 说明：下载受限内容时提示登录。
}

export function useSharedController({ user, setAlertMessage, setViewingImage, onRequestLogin }: UseSharedControllerParams) {
    const isMobile = useIsMobile();

    const { maps, agents } = useValorantData();

    const [selectedMap, setSelectedMapState] = useState<MapOption | null>(null);
    const [selectedAgent, setSelectedAgent] = useState<AgentOption | null>(null);
    const [selectedAbilityIndex, setSelectedAbilityIndex] = useState<number | null>(null);
    const [selectedSide, setSelectedSide] = useState<'all' | 'attack' | 'defense'>(() => isMobile ? 'attack' : 'all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [selectedLineupId, setSelectedLineupId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lineups, setLineups] = useState<BaseLineup[]>([]);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [viewingLineup, setViewingLineup] = useState<BaseLineup | null>(null);
    const [selectedSharedUserId, setSelectedSharedUserId] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [savingLineupIds, setSavingLineupIds] = useState<Set<string>>(new Set());
    const [saveProgressMap, setSaveProgressMap] = useState<Record<string, number>>({});
    // const [isSavingToPersonal, setIsSavingToPersonal] = useState(false); // Removed
    // const [saveProgress, setSaveProgress] = useState(0); // Removed
    const [isConfigConfirmOpen, setIsConfigConfirmOpen] = useState(false);


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

    // 默认使用官方订阅（第一个）
    const currentSubscription = useMemo(() => getSubscriptionList()[0], []);

    const activeClient = useMemo(() => {
        if (currentSubscription.id === 'local' || currentSubscription.mode === 'redirect' || !currentSubscription.api) {
            return undefined;
        }
        return createClient(currentSubscription.api.supabaseUrl, currentSubscription.api.supabaseAnonKey);
    }, [currentSubscription]);

    const mapNameZhToEn = useMemo<Record<string, string>>(() => {
        const reverse: Record<string, string> = {};
        Object.entries(MAP_TRANSLATIONS).forEach(([en, zh]) => {
            reverse[zh] = en;
        });
        return reverse;
    }, []);

    const selectedLineup = useMemo(() => {
        return lineups.find((l) => l.id === selectedLineupId) || null;
    }, [lineups, selectedLineupId]) as SharedLineup | null;

    const { getMapDisplayName, getMapEnglishName, getMapUrl, getMapCoverUrl } = useMapInfo({
        selectedMap,
        selectedSide,
    });

    useEffect(() => {
        if (maps.length > 0 && !selectedMap) {
            const params = new URLSearchParams(window.location.search);
            const mapName = params.get('map');
            const targetMap = mapName ? maps.find(m => m.displayName === mapName) : null;
            setSelectedMapState(targetMap || maps[0]);
        }
    }, [maps, selectedMap]);

    const [hasInitializedAgent, setHasInitializedAgent] = useState(false);

    useEffect(() => {
        if (agents.length > 0 && !selectedAgent && !hasInitializedAgent) {
            const params = new URLSearchParams(window.location.search);
            const agentName = params.get('agent');
            const targetAgent = agentName ? agents.find(a => a.displayName === agentName) : null;
            setSelectedAgent(targetAgent || agents[0]);
            setHasInitializedAgent(true);
        }
    }, [agents, selectedAgent, hasInitializedAgent]);

    const hasRestoredLineup = useRef(false);
    const initialLineupId = useRef<string | null>(null);

    // 初始化时记录 URL 中的 lineup ID
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        initialLineupId.current = params.get('lineup');
    }, []);

    // 恢复选中的点位 (仅恢复初始 ID)
    useEffect(() => {
        if (lineups.length > 0 && !selectedLineupId && !hasRestoredLineup.current && initialLineupId.current) {
            const target = lineups.find(l => l.id === initialLineupId.current);
            if (target) {
                setSelectedLineupId(target.id);
                setViewingLineup(target);
                hasRestoredLineup.current = true;
            }
        }
    }, [lineups, selectedLineupId]);

    // 同步状态到 URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        let changed = false;

        if (selectedMap && params.get('map') !== selectedMap.displayName) {
            params.set('map', selectedMap.displayName);
            changed = true;
        }
        if (selectedAgent && params.get('agent') !== selectedAgent.displayName) {
            params.set('agent', selectedAgent.displayName);
            changed = true;
        }
        if (selectedLineupId && params.get('lineup') !== selectedLineupId) {
            params.set('lineup', selectedLineupId);
            changed = true;
        } else if (!selectedLineupId && params.has('lineup')) {
            params.delete('lineup');
            changed = true;
        }

        if (changed) {
            const newUrl = `${window.location.pathname}?${params.toString()}`;
            window.history.replaceState(null, '', newUrl);
        }
    }, [selectedMap, selectedAgent, selectedLineupId]);






    const loadLineups = useCallback(async () => {
        setIsLoading(true);
        try {
            // @ts-ignore
            // 说明：activeClient 类型推断存在差异，但与 SupabaseClient 兼容。
            const data = await fetchSharedList(mapNameZhToEn, activeClient);
            setLineups(data || []);
        } catch (err) {
            console.error('加载共享点位失败:', err);
            setAlertMessage('加载点位失败: 连接订阅源出错');
            setLineups([]);
        } finally {
            setIsLoading(false);
        }
    }, [mapNameZhToEn, setAlertMessage, activeClient]);

    useEffect(() => {
        loadLineups();
    }, [loadLineups]); // 说明：依赖 currentSubscription 影响 activeClient。


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
            const userMatch = !selectedSharedUserId || l.userId === selectedSharedUserId;
            return mapMatch && agentMatch && sideMatch && abilityMatch && searchMatch && userMatch;
        });
    }, [lineups, selectedMap, selectedAgent, selectedSide, selectedAbilityIndex, searchQuery, selectedSharedUserId, mapNameZhToEn]);

    const contributors = useMemo(() => {
        const userIds = lineups.map((l) => l.userId).filter(Boolean) as string[];
        return Array.from(new Set(userIds));
    }, [lineups]);

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

    const mapIcon = useMemo(() => {
        return getMapUrl();
    }, [getMapUrl, selectedSide]);

    const mapCover = useMemo(() => {
        return getMapCoverUrl();
    }, [getMapCoverUrl, selectedSide]);

    const handleSelectMap = useCallback((map: MapOption) => {
        setSelectedMapState(map);
        setSelectedLineupId(null);
        if (agents.length > 0) {
            setSelectedAgent(agents[0]);
        } else {
            setSelectedAgent(null);
        }
        setIsMapModalOpen(false);
    }, [agents]);

    const handleViewLineup = useCallback((id: string) => {
        setSelectedLineupId(id);
        const lineup = lineups.find((l) => l.id === id);
        if (lineup) {
            setViewingLineup(lineup);
        }
    }, [lineups]);

    const handleViewerClose = useCallback(() => {
        setViewingLineup(null);
        setSelectedLineupId(null); // 说明：清除选中以移除连线。
    }, []);

    const handleDownload = useCallback(async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();

        if (!user) {
            setAlertMessage('下载点位需要登录，请先登录');
            onRequestLogin();
            return;
        }

        const target = lineups.find((l) => l.id === id);
        if (!target) return;

        if (isDownloading) return;

        const { allowed, limit, remaining } = await checkDailyDownloadLimit(user.id);
        if (!allowed) {
            setAlertMessage(`今日下载次数已达上限 (${limit}次)，请明天再试`);
            return;
        }

        try {
            setIsDownloading(true);
            setAlertMessage('正在打包点位数据，请稍候...');

            const result = await downloadLineupBundle(target);

            await incrementDownloadCount(user.id);
            await logDownload({
                userId: user.id,
                userEmail: user.email || '',
                lineupId: target.id,
                lineupTitle: target.title,
                mapName: target.mapName, // 说明：SharedLineup 使用 mapName。
                agentName: target.agentName, // 说明：SharedLineup 使用 agentName。
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

    const executeSaveToPersonal = useCallback(async (lineup: SharedLineup) => {
        const lineupId = lineup.id;
        setSavingLineupIds(prev => new Set(prev).add(lineupId));
        setSaveProgressMap(prev => ({ ...prev, [lineupId]: 0 }));

        // setAlertMessage('正在保存到个人库...'); // 移除 Alert，使用后台进度条

        try {
            // 1. 检查是否已保存
            const exists = await findLineupByClone(user!.id, lineupId); // user! is safe here likely
            if (exists) {
                setAlertMessage('该点位已保存到您的个人库');
                setSavingLineupIds(prev => {
                    const next = new Set(prev);
                    next.delete(lineupId);
                    return next;
                });
                return;
            }

            // 2. 构造 payload
            const payload: LineupDbPayload = {
                title: lineup.title,
                map_name: lineup.mapName, // SharedLineup 使用 mapName
                agent_name: lineup.agentName,
                agent_icon: lineup.agentIcon,
                skill_icon: lineup.skillIcon,
                side: lineup.side,
                ability_index: lineup.abilityIndex,
                agent_pos: lineup.agentPos,
                skill_pos: lineup.skillPos,
                stand_img: lineup.standImg,
                stand_desc: lineup.standDesc,
                stand2_img: lineup.stand2Img,
                stand2_desc: lineup.stand2Desc,
                aim_img: lineup.aimImg,
                aim_desc: lineup.aimDesc,
                aim2_img: lineup.aim2Img,
                aim2_desc: lineup.aim2Desc,
                land_img: lineup.landImg,
                land_desc: lineup.landDesc,
                source_link: lineup.sourceLink,
                author_name: lineup.authorName,
                author_avatar: lineup.authorAvatar,
                author_uid: lineup.authorUid,
                user_id: user!.id,
                cloned_from: lineup.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            setSaveProgressMap(prev => ({ ...prev, [lineupId]: 10 })); // 初始进度

            // 3. 读取并解析图床配置 (兼容多图床 key)
            let localConfig: ImageBedConfig | null = null;
            try {
                const multiConfigStr = localStorage.getItem('valpoint_imagebed_configs');
                if (multiConfigStr) {
                    const multiConfigs = JSON.parse(multiConfigStr);
                    const lastProvider = localStorage.getItem('valpoint_imagebed_last_provider') || 'aliyun';
                    if (multiConfigs[lastProvider]) {
                        localConfig = multiConfigs[lastProvider];
                    }
                }
                // Fallback (旧数据)
                if (!localConfig) {
                    const old = localStorage.getItem('valpoint_imagebed_config');
                    if (old) localConfig = JSON.parse(old);
                }
            } catch (e) {
                console.error('Failed to parse image config', e);
            }

            // 4. 如果有配置，执行图片迁移
            if (localConfig && localConfig.accessKeyId) {
                // setAlertMessage('正在迁移图片到您的图床...');
                try {
                    const startTime = performance.now();
                    console.log(`[ImageMigration] 开始迁移图片: ${lineup.title} (ID: ${lineup.id})`);

                    const migrated = await migrateLineupImages(lineup, localConfig, (current, total) => {
                        // setAlertMessage(`正在迁移图片 (${current}/${total})...`);
                        // 计算进度: 10% -> 90%
                        const percent = 10 + Math.floor((current / total) * 80);
                        setSaveProgressMap(prev => ({ ...prev, [lineupId]: percent }));
                    });

                    const durationMs = performance.now() - startTime;
                    console.log(`[ImageMigration] 迁移完成，总耗时: ${(durationMs / 1000).toFixed(2)}s`);

                    // 更新 payload 中的图片链接
                    payload.stand_img = migrated.standImg;
                    payload.stand2_img = migrated.stand2Img;
                    payload.aim_img = migrated.aimImg;
                    payload.aim2_img = migrated.aim2Img;
                    payload.land_img = migrated.landImg;
                } catch (e) {
                    console.error('图片迁移失败', e);
                    setAlertMessage('图片迁移失败，将保存原始链接');
                }
            }

            setSaveProgressMap(prev => ({ ...prev, [lineupId]: 95 }));

            // 5. 保存到个人库
            await saveLineupApi(payload);
            setSaveProgressMap(prev => ({ ...prev, [lineupId]: 100 }));

            // 仅仅给一个简单的 Toast 提示，不要阻断
            // setAlertMessage('后台保存完成'); // 稍微轻一点的提示 -> 用户明确不要这个提示

        } catch (err: any) {
            console.error('保存失败', err);
            setAlertMessage(`保存失败: ${err.message}`);
        } finally {
            setSavingLineupIds(prev => {
                const next = new Set(prev);
                next.delete(lineupId);
                return next;
            });
            // Delay removing progress map to let animation finish?
            // For now, removing ID stops the "saving" state. We can clean up map later or just leave it.
            // Leaving it is fine as long as we don't start with old value. We init with 0 on start.
        }
    }, [user, setAlertMessage, setSavingLineupIds, setSaveProgressMap]);

    // 修改 handleSaveToPersonal 返回 boolean 表示是否开始
    const handleSaveToPersonal = useCallback(async (lineup: SharedLineup): Promise<boolean> => {
        if (!user) {
            onRequestLogin();
            return false;
        }

        // 检查并发数
        if (savingLineupIds.size >= 5) {
            setAlertMessage('同时下载任务过多 (最多5个)，请稍候...');
            return false;
        }

        if (savingLineupIds.has(lineup.id)) {
            return false; // already saving
        }

        // 检查图床配置
        let hasConfig = false;
        try {
            const multiConfigStr = localStorage.getItem('valpoint_imagebed_configs');
            if (multiConfigStr) {
                const multiConfigs = JSON.parse(multiConfigStr);
                const lastProvider = localStorage.getItem('valpoint_imagebed_last_provider');
                if (lastProvider && multiConfigs[lastProvider] && multiConfigs[lastProvider].accessKeyId) {
                    hasConfig = true;
                }
            }
            if (!hasConfig) {
                const old = localStorage.getItem('valpoint_imagebed_config');
                if (old && JSON.parse(old).accessKeyId) hasConfig = true;
            }
        } catch (e) { }

        if (!hasConfig) {
            // setPendingSaveLineup(lineup); // 不再允许暂存，强制配置
            setIsConfigConfirmOpen(true);
            return false;
        }

        // 启动后台任务，不 await
        executeSaveToPersonal(lineup);
        return true; // 表示已启动
    }, [user, onRequestLogin, executeSaveToPersonal, savingLineupIds, setAlertMessage]);

    const handleCancelSave = useCallback(() => {
        setIsConfigConfirmOpen(false);
    }, []);

    const handleReset = useCallback(() => {
        if (maps.length > 0) setSelectedMapState(maps[0]);
        if (agents.length > 0) setSelectedAgent(agents[0]);
        else setSelectedAgent(null);
        setSelectedAbilityIndex(null);
        setSelectedSide(isMobile ? 'attack' : 'all');
        setSelectedLineupId(null);
        setViewingLineup(null);
        setSearchQuery('');
    }, [maps, agents, isMobile]);

    return {
        isLoading,
        isDownloading,
        user,

        maps,
        selectedMap,
        setSelectedMap: handleSelectMap,
        isMapModalOpen,
        setIsMapModalOpen,
        mapIcon,
        mapCover,
        getMapDisplayName,
        getMapEnglishName,

        agents,
        selectedAgent,
        setSelectedAgent,
        selectedAbilityIndex,
        setSelectedAbilityIndex,
        agentCounts,

        selectedSide,
        setSelectedSide,
        searchQuery,
        setSearchQuery,
        isFilterModalOpen,
        setIsFilterModalOpen,

        lineups,
        filteredLineups,
        selectedLineupId,
        setSelectedLineupId,
        selectedLineup,
        handleViewLineup,
        handleDownload,
        viewingLineup,
        setViewingLineup,
        handleViewerClose,
        contributors,
        selectedSharedUserId,
        setSelectedSharedUserId,

        newLineupData,
        setNewLineupData,
        placingType,
        setPlacingType: (val: string | null) => {
            setPlacingType(val as 'agent' | 'skill' | null);
        },

        setViewingImage,

        currentSubscription,

        handleSaveToPersonal,
        // isSavingToPersonal,
        savingLineupIds,
        // saveProgress,
        saveProgressAverage: useMemo(() => {
            const ids = Object.keys(saveProgressMap).filter(id => savingLineupIds.has(id));
            if (ids.length === 0) return 0;
            const sum = ids.reduce((acc, id) => acc + (saveProgressMap[id] || 0), 0);
            return Math.floor(sum / ids.length);
        }, [saveProgressMap, savingLineupIds]),
        isConfigConfirmOpen,
        handleCancelSave,
        handleReset,
    };
}