/**
 * LeafletMap - Leaflet地图
 *
 * 职责：
 * - 渲染Leaflet地图相关的界面结构与样式。
 * - 处理用户交互与状态变更并触发回调。
 * - 组合子组件并提供可配置项。
 */

// @ts-nocheck
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as L from 'leaflet';
import { getAbilityIcon } from '../utils/abilityIcons';
import { BaseLineup, AgentOption, NewLineupForm, SharedLineup, LineupPosition } from '../types/lineup';
import { clusterPositions } from '../features/lineups/lineupPositions';
import type { PositionCandidate } from '../features/lineups/lineupPositions';
import { ActiveTab } from '../types/app';
import { useEmailAuth } from '../hooks/useEmailAuth';
import { useErrorMarks } from '../hooks/useErrorMarks';

type Lineup = {
  id: string;
  agentPos?: { lat: number; lng: number } | null;
  skillPos?: { lat: number; lng: number } | null;
  agentIcon?: string | null;
  skillIcon?: string | null;
};

type Props = {
  mapIcon: string | null;
  mapCover?: string | null;
  disableFitBoundsAnimation?: boolean;
  activeTab: string;
  lineups: Lineup[];
  selectedLineupId: string | null;
  onLineupSelect: (id: string | null) => void;
  newLineupData: any;
  setNewLineupData: (fn: (prev: any) => any) => void;
  placingType: string | null;
  setPlacingType: (val: string | null) => void;
  selectedAgent: any;
  selectedAbilityIndex: number | null;
  pickingExisting?: 'agent' | 'skill' | null;
  existingAgentPoints?: PositionCandidate[];
  existingSkillPoints?: PositionCandidate[];
  onPickExisting?: (type: 'agent' | 'skill', pos: LineupPosition) => void;
  onViewLineup?: (id: string) => void;
  isFlipped: boolean;
  sharedLineup?: any;
  showErrorMarking?: boolean;
};

const EMPTY_POSITIONS: PositionCandidate[] = [];

const LeafletMap: React.FC<Props> = ({
  mapIcon,
  mapCover,
  disableFitBoundsAnimation = false,
  activeTab,
  lineups,
  selectedLineupId,
  onLineupSelect,
  newLineupData,
  setNewLineupData,
  placingType,
  setPlacingType,
  selectedAgent,
  selectedAbilityIndex,
  pickingExisting = null,
  existingAgentPoints = EMPTY_POSITIONS,
  existingSkillPoints = EMPTY_POSITIONS,
  onPickExisting,
  onViewLineup,
  isFlipped,
  sharedLineup,
  showErrorMarking = false,
}) => {
  const { user } = useEmailAuth();
  const { errorMarks } = useErrorMarks(showErrorMarking ? user?.id : undefined);

  const fitBoundsOptions = useMemo(
    () => (disableFitBoundsAnimation ? { animate: false } : undefined),
    [disableFitBoundsAnimation]
  );
  const mapRef = useRef(null);
  const mapInstance = useRef<any>(null);
  const layers = useRef<{ createLayer: any[]; sharedLayer: any[] }>({ createLayer: [], sharedLayer: [] });
  /** 说明：合并后的站位/落点标记，按簇 key 索引，memberIds 用于选中与悬停判定。 */
  const agentClusterRef = useRef<Map<string, { marker: any; memberIds: string[] }>>(new Map());
  const landClusterRef = useRef<Map<string, { marker: any; memberIds: string[] }>>(new Map());
  /** 说明：每条点位所属簇锚点的视图坐标，悬停/选中时据此画连线。 */
  const lineupViewPos = useRef<Record<string, { a: any; b: any }>>({});
  const emphasisRef = useRef<any[]>([]);
  /** 说明：强调线单独放一个高于弹层的 pane，避免被弹层遮住。 */
  const emphasisPaneRef = useRef<any>(null);
  const [hoveredLineupIds, setHoveredLineupIds] = useState<string[]>([]);
  const hasAppliedFlip = useRef(false);
  /** 说明：回调走 ref，避免父级内联函数导致标记反复重建。 */
  const handlersRef = useRef({ onLineupSelect, onViewLineup, onPickExisting });
  handlersRef.current = { onLineupSelect, onViewLineup, onPickExisting };

  const transformPos = (pos: any) => {
    if (!pos) return null;
    if (isFlipped) {
      return { lat: 1000 - pos.lat, lng: 1000 - pos.lng };
    }
    return pos;
  };

  const inverseTransformPos = (pos: any) => {
    if (!pos) return null;
    if (isFlipped) {
      return { lat: 1000 - pos.lat, lng: 1000 - pos.lng };
    }
    return pos;
  };

  useEffect(() => {
    setHoveredLineupIds([]);
  }, [lineups, selectedLineupId]);

  const clearClusterLayers = (map: any) => {
    agentClusterRef.current.forEach(({ marker }) => map.removeLayer(marker));
    agentClusterRef.current.clear();
    landClusterRef.current.forEach(({ marker }) => map.removeLayer(marker));
    landClusterRef.current.clear();
    emphasisRef.current.forEach((line) => map.removeLayer(line));
    emphasisRef.current = [];
    lineupViewPos.current = {};
  };

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }
    mapRef.current.innerHTML = '';
    const map = L.map(mapRef.current, {
      crs: L.CRS.Simple,
      minZoom: -2,
      maxZoom: 2,
      zoomControl: false,
      attributionControl: false,
      zoomSnap: 0.1,
      scrollWheelZoom: false,
      wheelPxPerZoomLevel: 120,
    });
    mapInstance.current = map;
    const pane = map.createPane('emphasisPane');
    pane.style.zIndex = '750';
    pane.style.pointerEvents = 'none';
    emphasisPaneRef.current = pane;
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // 说明：为 iPad/触控模拟环境提供稳定的滚轮缩放兜底能力。
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    const container: HTMLElement = map.getContainer();
    const handleWheelZoom = (event: WheelEvent) => {
      event.preventDefault();

      const zoomDelta = event.deltaY < 0 ? 0.2 : -0.2;
      const currentZoom = map.getZoom();
      const nextZoom = Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), currentZoom + zoomDelta));
      if (nextZoom === currentZoom) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const point = L.point(event.clientX - rect.left, event.clientY - rect.top);
      map.setZoomAround(point, nextZoom, { animate: false });
    };

    container.addEventListener('wheel', handleWheelZoom, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheelZoom);
    };
  }, []);

  // 说明：监听容器尺寸变化，解决生产环境 CSS 延迟加载导致地图不居中的问题
  useEffect(() => {
    const map = mapInstance.current;
    const container = mapRef.current;
    if (!map || !container) return;

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
      const bounds: L.LatLngBoundsExpression = [[0, 0], [1000, 1000]];
      map.fitBounds(bounds, { animate: false });
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    const clickHandler = (e: any) => {
      L.DomEvent.preventDefault(e);
      L.DomEvent.stop(e);
      if (activeTab === 'create' && pickingExisting) {
        return;
      }
      if (activeTab === 'create' && placingType) {
        const rawPos = { lat: e.latlng.lat, lng: e.latlng.lng };
        const standardPos = inverseTransformPos(rawPos);
        if (placingType === 'agent') setNewLineupData((prev: any) => ({ ...prev, agentPos: standardPos }));
        else setNewLineupData((prev: any) => ({ ...prev, skillPos: standardPos }));
      } else if (activeTab === 'view') {
        onLineupSelect(null);
      }
    };
    map.off('click');
    map.on('click', clickHandler);
    return () => map.off('click', clickHandler);
  }, [activeTab, placingType, pickingExisting, setNewLineupData, onLineupSelect, isFlipped]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapIcon) return;
    map.eachLayer((l: any) => {
      if (l instanceof L.ImageOverlay) map.removeLayer(l);
    });
    const bounds: any = [
      [0, 0],
      [1000, 1000],
    ];
    L.imageOverlay(mapIcon, bounds).addTo(map);
    map.fitBounds(bounds, fitBoundsOptions);
  }, [mapIcon, fitBoundsOptions]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    if (!hasAppliedFlip.current) {
      hasAppliedFlip.current = true;
      return;
    }
    const timer = setTimeout(() => {
      map.invalidateSize();
      const bounds: any = [[0, 0], [1000, 1000]];
      map.fitBounds(bounds, fitBoundsOptions);
    }, 100);
    return () => clearTimeout(timer);
  }, [isFlipped, fitBoundsOptions]);

  const createIcon = (type: 'agent' | 'skill', imgUrl?: string | null, hasError?: boolean) => {
    const errorOverlay = hasError ? `<div class="absolute inset-0 bg-red-500/50 rounded-full z-10 pointer-events-none"></div>` : '';
    const errorStyle = hasError ? `style="border-color: #ef4444 !important;"` : '';
    const content = imgUrl
      ? `<div class="marker-icon-wrapper relative" ${errorStyle}>${errorOverlay}<img src="${imgUrl}" class="marker-img ${type === 'skill' ? 'marker-img-skill' : ''
      }"/></div>`
      : `<div class="marker-icon-wrapper bg-[#ff4655] text-white font-bold text-xs flex items-center justify-center relative" ${errorStyle}>${errorOverlay}${type === 'agent' ? 'A' : 'S'
      }</div>`;
    return L.divIcon({ className: `custom-marker ${hasError ? 'marker-error' : ''}`, html: content, iconSize: [32, 32], iconAnchor: [16, 16] });
  };

  // 说明：候选点直接用英雄/技能头像，保留呼吸光圈；无图标时退回字母。
  const candidateIcon = (type: 'agent' | 'skill', imgUrl?: string | null) =>
    L.divIcon({
      className: 'custom-marker marker-candidate',
      html: imgUrl
        ? `<div class="marker-icon-wrapper"><img src="${imgUrl}" class="marker-img ${type === 'skill' ? 'marker-img-skill' : ''}"/></div>`
        : `<div class="marker-icon-wrapper ${type === 'skill' ? 'marker-img-skill' : ''}"><span>${type === 'agent' ? 'A' : 'S'}</span></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

  /** 说明：合并簇的弹层列出簇内点位，点击后选中对应点位。 */
  const buildClusterPopup = (
    members: Lineup[],
    onSelect: (id: string) => void,
    onHover: (id: string | null) => void,
  ) => {
    const container = document.createElement('div');
    container.className = 'cluster-popup';

    const header = document.createElement('div');
    header.className = 'cluster-popup-header';
    header.textContent = `${members.length} 个点位`;
    container.appendChild(header);

    members.forEach((m: any) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'cluster-popup-item';
      item.textContent = m.title || '未命名点位';
      // 说明：悬停条目时只高亮该点位的连线，便于分辨归属。
      item.addEventListener('mouseenter', () => onHover(m.id));
      item.addEventListener('mouseleave', () => onHover(null));
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        onHover(null);
        onSelect(m.id);
      });
      container.appendChild(item);
    });

    container.addEventListener('mouseleave', () => onHover(null));
    return container;
  };

  const updateMarkerStyle = (marker: any, isSelected: boolean, isInactive: boolean) => {
    const el = marker.getElement();
    if (!el) return;
    if (isSelected) {
      el.classList.add('marker-active');
      el.classList.remove('marker-inactive');
      marker.setZIndexOffset(1000);
    } else if (isInactive) {
      el.classList.remove('marker-active');
      el.classList.add('marker-inactive');
      marker.setZIndexOffset(0);
    } else {
      el.classList.remove('marker-active');
      el.classList.remove('marker-inactive');
      marker.setZIndexOffset(500);
    }
  };

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    layers.current.createLayer.forEach((l) => map.removeLayer(l));
    layers.current.createLayer = [];
    if (layers.current.sharedLayer.length) {
      layers.current.sharedLayer.forEach((l) => map.removeLayer(l));
      layers.current.sharedLayer = [];
    }
    clearClusterLayers(map);

    if (activeTab === 'shared' && sharedLineup) {
      const l = sharedLineup;
      const viewAgentPos = transformPos(l.agentPos);
      const viewSkillPos = transformPos(l.skillPos);
      if (viewAgentPos && viewSkillPos) {
        const hasError = !!errorMarks[l.id];
        const am = L.marker(viewAgentPos, { icon: createIcon('agent', l.agentIcon, hasError) }).addTo(map);
        const sm = L.marker(viewSkillPos, { icon: createIcon('skill', l.skillIcon, hasError) }).addTo(map);
        const line = L.polyline([viewAgentPos, viewSkillPos], { color: '#ff4655', weight: 3, dashArray: '8, 8' }).addTo(map);
        layers.current.sharedLayer = [am, sm, line];
      }
      return;
    }

    if (activeTab === 'create') {
      const { agentPos, skillPos } = newLineupData;
      const currentAgentIcon = selectedAgent?.displayIcon || null;
      const currentSkillIcon = getAbilityIcon(selectedAgent, selectedAbilityIndex);

      const viewAgentPos = transformPos(agentPos);
      const viewSkillPos = transformPos(skillPos);

      const onDragEnd = (type: 'agent' | 'skill') => (e: any) => {
        const rawPos = { lat: e.target.getLatLng().lat, lng: e.target.getLatLng().lng };
        const standardPos = inverseTransformPos(rawPos);
        if (type === 'agent') setNewLineupData((prev: any) => ({ ...prev, agentPos: standardPos }));
        else setNewLineupData((prev: any) => ({ ...prev, skillPos: standardPos }));
      };

      // 说明：拾取已有位置时只显示候选点，隐藏当前站位/落点与连线。
      if (!pickingExisting) {
        if (viewAgentPos) {
          const m = L.marker(viewAgentPos, { icon: createIcon('agent', currentAgentIcon), draggable: true, keyboard: false }).addTo(map);
          m.on('dragend', onDragEnd('agent'));
          layers.current.createLayer.push(m);
        }
        if (viewSkillPos) {
          const m = L.marker(viewSkillPos, { icon: createIcon('skill', currentSkillIcon), draggable: true, keyboard: false }).addTo(map);
          m.on('dragend', onDragEnd('skill'));
          layers.current.createLayer.push(m);
        }
        if (viewAgentPos && viewSkillPos) {
          const l = L.polyline([viewAgentPos, viewSkillPos], { color: '#ff4655', weight: 3, dashArray: '8, 8' }).addTo(map);
          layers.current.createLayer.push(l);
        }
      }

      // 说明：拾取已有站位/落点，只高亮候选点，不画落点与连线。
      if (pickingExisting) {
        const candidates = pickingExisting === 'agent' ? existingAgentPoints : existingSkillPoints;
        // 说明：优先用候选自带的图标（站位=英雄头像，落点=技能图标），缺失时才回落到当前选择。
        const fallbackImg =
          pickingExisting === 'agent'
            ? selectedAgent?.displayIcon || null
            : currentSkillIcon || selectedAgent?.displayIcon || null;
        candidates.forEach(({ pos, icon }) => {
          const viewPos = transformPos(pos);
          if (!viewPos) return;
          const m = L.marker(viewPos, { icon: candidateIcon(pickingExisting, icon || fallbackImg), keyboard: false }).addTo(map);
          m.on('click', (e: any) => {
            L.DomEvent.preventDefault(e);
            L.DomEvent.stop(e);
            handlersRef.current.onPickExisting?.(pickingExisting, pos);
          });
          layers.current.createLayer.push(m);
        });
      }
      return;
    }

    // 说明：查看模式按簇渲染，相近的站位/落点合并为一个标记；连线默认不画，悬停/选中时才出现。
    const agentClusters = clusterPositions(lineups, (l) => l.agentPos, (l) => l.agentName || '');
    const landClusters = clusterPositions(lineups, (l) => l.skillPos, (l) => `${l.agentName || ''}|${l.abilityIndex ?? ''}`);

    const agentKeyById: Record<string, string> = {};
    agentClusters.forEach((c) => c.members.forEach((m) => { agentKeyById[m.id] = c.key; }));
    const landKeyById: Record<string, string> = {};
    landClusters.forEach((c) => c.members.forEach((m) => { landKeyById[m.id] = c.key; }));

    lineups.forEach((l) => {
      const aCluster = agentClusters.find((c) => c.key === agentKeyById[l.id]);
      const lCluster = landClusters.find((c) => c.key === landKeyById[l.id]);
      if (!aCluster || !lCluster) return;
      const a = transformPos(aCluster.pos);
      const b = transformPos(lCluster.pos);
      if (a && b) lineupViewPos.current[l.id] = { a, b };
    });

    const addClusterMarker = (type: 'agent' | 'skill', cluster: any) => {
      const viewPos = transformPos(cluster.pos);
      if (!viewPos) return;
      const memberIds = cluster.members.map((m: Lineup) => m.id);
      const hasError = cluster.members.some((m: Lineup) => !!errorMarks[m.id]);
      const first = cluster.members[0];
      const marker = L.marker(viewPos, {
        icon: createIcon(type, type === 'agent' ? first.agentIcon : first.skillIcon, hasError),
        keyboard: false,
      }).addTo(map);

      if (memberIds.length > 1) {
        marker.bindPopup(buildClusterPopup(
          cluster.members,
          (id: string) => {
            handlersRef.current.onLineupSelect(id);
            handlersRef.current.onViewLineup?.(id);
            map.closePopup();
          },
          (id: string | null) => setHoveredLineupIds(id ? [id] : []),
        ));
      } else {
        marker.on('click', (e: any) => {
          L.DomEvent.preventDefault(e);
          L.DomEvent.stop(e);
          handlersRef.current.onLineupSelect(first.id);
          handlersRef.current.onViewLineup?.(first.id);
        });
      }

      marker.on('mouseover', () => setHoveredLineupIds(memberIds));
      marker.on('mouseout', () => setHoveredLineupIds([]));

      const entry = { marker, memberIds };
      if (type === 'agent') agentClusterRef.current.set(cluster.key, entry);
      else landClusterRef.current.set(cluster.key, entry);
    };

    agentClusters.forEach((c) => addClusterMarker('agent', c));
    landClusters.forEach((c) => addClusterMarker('skill', c));
  }, [lineups, activeTab, newLineupData, selectedAgent, selectedAbilityIndex, isFlipped, sharedLineup, errorMarks, pickingExisting, existingAgentPoints, existingSkillPoints]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || activeTab !== 'view') return;

    const applySelection = (ref: typeof agentClusterRef) => {
      ref.current.forEach(({ marker, memberIds }) => {
        const isSelected = memberIds.includes(selectedLineupId as string);
        const isInactive = !!selectedLineupId && !isSelected;
        updateMarkerStyle(marker, isSelected, isInactive);
      });
    };
    applySelection(agentClusterRef);
    applySelection(landClusterRef);

    emphasisRef.current.forEach((line) => map.removeLayer(line));
    emphasisRef.current = [];

    // 说明：默认不画连线，仅在悬停或选中时按簇锚点画，同簇多条落点自然分叉。
    const drawEmphasis = (ids: string[], color: string, weight: number, dashArray: string, opacity = 1) => {
      const drawn = new Set<string>();
      ids.forEach((id) => {
        const pos = lineupViewPos.current[id];
        if (!pos) return;
        const key = `${pos.a.lat},${pos.a.lng}->${pos.b.lat},${pos.b.lng}`;
        if (drawn.has(key)) return;
        drawn.add(key);
        const line = L.polyline([pos.a, pos.b], {
          color,
          weight,
          dashArray,
          opacity,
          pane: 'emphasisPane',
          interactive: false,
        }).addTo(map);
        line.bringToFront();
        emphasisRef.current.push(line);
      });
    };

    if (hoveredLineupIds.length > 0) {
      drawEmphasis(hoveredLineupIds.filter((id) => id !== selectedLineupId), '#ffffff', 2, '5, 5', 0.7);
    }
    if (selectedLineupId) {
      drawEmphasis([selectedLineupId], '#ff4655', 3, '8, 8');
    }
  }, [selectedLineupId, hoveredLineupIds, activeTab, lineups]);

  return (
    <div className="w-full h-full relative">
      {mapCover && (
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{ backgroundImage: `url(${mapCover})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
      )}
      <div ref={mapRef} className="w-full h-full z-0 outline-none relative" />
    </div>
  );
};

export default React.memo(LeafletMap);
