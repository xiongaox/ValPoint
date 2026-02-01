/**
 * LeafletMap - Leaflet地图
 *
 * 职责：
 * - 渲染Leaflet地图相关的界面结构与样式。
 * - 处理用户交互与状态变更并触发回调。
 * - 组合子组件并提供可配置项。
 */

// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { getAbilityIcon } from '../utils/abilityIcons';

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
  onViewLineup?: (id: string) => void;
  isFlipped: boolean;
  sharedLineup?: any;
};

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
  onViewLineup,
  isFlipped,
  sharedLineup,
}) => {
  const fitBoundsOptions = useMemo(
    () => (disableFitBoundsAnimation ? { animate: false } : undefined),
    [disableFitBoundsAnimation]
  );
  const mapRef = useRef(null);
  const mapInstance = useRef<any>(null);
  const markerMap = useRef<Record<string, any>>({});
  const layers = useRef<{ activeLine: any; createLayer: any[]; sharedLayer: any[] }>({ activeLine: null, createLayer: [], sharedLayer: [] });
  const [hoveredLineupId, setHoveredLineupId] = useState<string | null>(null);
  const hoverLayer = useRef<any>(null);
  const hasAppliedFlip = useRef(false);

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
    setHoveredLineupId(null);
  }, [lineups, selectedLineupId]);

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
      wheelPxPerZoomLevel: 120,
    });
    mapInstance.current = map;
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
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
  }, [activeTab, placingType, setNewLineupData, onLineupSelect, isFlipped]);

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

  const createIcon = (type: 'agent' | 'skill', imgUrl?: string) => {
    const content = imgUrl
      ? `<div class="marker-icon-wrapper border-white"><img src="${encodeURI(imgUrl)}" class="marker-img ${type === 'skill' ? 'marker-img-skill' : ''
      }"/></div>`
      : `<div class="marker-icon-wrapper bg-[#ff4655] text-white font-bold text-xs flex items-center justify-center">${type === 'agent' ? 'A' : 'S'
      }</div>`;
    return L.divIcon({ className: `custom-marker`, html: content, iconSize: [32, 32], iconAnchor: [16, 16] });
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

    if (layers.current.activeLine) {
      map.removeLayer(layers.current.activeLine);
      layers.current.activeLine = null;
    }
    if (hoverLayer.current) {
      map.removeLayer(hoverLayer.current);
      hoverLayer.current = null;
    }

    layers.current.createLayer.forEach((l) => map.removeLayer(l));
    layers.current.createLayer = [];
    if (layers.current.sharedLayer.length) {
      layers.current.sharedLayer.forEach((l) => map.removeLayer(l));
      layers.current.sharedLayer = [];
    }

    if (activeTab === 'shared' && sharedLineup) {
      Object.values(markerMap.current).forEach(({ agent, skill }) => {
        map.removeLayer(agent);
        map.removeLayer(skill);
      });
      markerMap.current = {};
      if (layers.current.activeLine) {
        map.removeLayer(layers.current.activeLine);
        layers.current.activeLine = null;
      }

      const l = sharedLineup;
      const viewAgentPos = transformPos(l.agentPos);
      const viewSkillPos = transformPos(l.skillPos);
      if (viewAgentPos && viewSkillPos) {
        const am = L.marker(viewAgentPos, { icon: createIcon('agent', l.agentIcon) }).addTo(map);
        const sm = L.marker(viewSkillPos, { icon: createIcon('skill', l.skillIcon) }).addTo(map);
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

      Object.values(markerMap.current).forEach(({ agent, skill }) => {
        map.removeLayer(agent);
        map.removeLayer(skill);
      });
      markerMap.current = {};
      if (layers.current.activeLine) {
        map.removeLayer(layers.current.activeLine);
        layers.current.activeLine = null;
      }
    } else {
      Object.values(markerMap.current).forEach(({ agent, skill }) => {
        map.removeLayer(agent);
        map.removeLayer(skill);
      });
      markerMap.current = {};

      lineups.forEach((l) => {
        const viewAgentPos = transformPos(l.agentPos);
        const viewSkillPos = transformPos(l.skillPos);
        if (!viewAgentPos || !viewSkillPos) return;

        const am = L.marker(viewAgentPos, { icon: createIcon('agent', l.agentIcon), keyboard: false }).addTo(map);
        const sm = L.marker(viewSkillPos, { icon: createIcon('skill', l.skillIcon), keyboard: false }).addTo(map);

        const handler = (e: any) => {
          L.DomEvent.preventDefault(e);
          L.DomEvent.stop(e);
          onLineupSelect(l.id);
          if (onViewLineup) onViewLineup(l.id);
        };
        am.on('click', handler);
        sm.on('click', handler);
        am.on('mouseover', () => setHoveredLineupId(l.id));
        am.on('mouseout', () => setHoveredLineupId(null));
        sm.on('mouseover', () => setHoveredLineupId(l.id));
        sm.on('mouseout', () => setHoveredLineupId(null));

        markerMap.current[l.id] = { agent: am, skill: sm, data: l, viewAgentPos, viewSkillPos };
        const isSelected = l.id === selectedLineupId;
        const isInactive = selectedLineupId && !isSelected;
        updateMarkerStyle(am, isSelected, isInactive);
        updateMarkerStyle(sm, isSelected, isInactive);
        if (isSelected) {
          const line = L.polyline([viewAgentPos, viewSkillPos], { color: '#ff4655', weight: 3, dashArray: '8, 8' }).addTo(map);
          layers.current.activeLine = line;
        }
      });
    }
  }, [lineups, activeTab, newLineupData, selectedAgent, selectedAbilityIndex, isFlipped, sharedLineup]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || activeTab !== 'view') return;
    if (layers.current.activeLine) {
      map.removeLayer(layers.current.activeLine);
      layers.current.activeLine = null;
    }
    Object.keys(markerMap.current).forEach((id) => {
      const { agent, skill, viewAgentPos, viewSkillPos } = markerMap.current[id];
      const isSelected = id === selectedLineupId;
      const isInactive = selectedLineupId && !isSelected;
      updateMarkerStyle(agent, isSelected, isInactive);
      updateMarkerStyle(skill, isSelected, isInactive);
      if (isSelected) {
        const line = L.polyline([viewAgentPos, viewSkillPos], { color: '#ff4655', weight: 3, dashArray: '8, 8' }).addTo(map);
        layers.current.activeLine = line;
      }
    });
  }, [selectedLineupId, activeTab]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    if (hoverLayer.current) {
      map.removeLayer(hoverLayer.current);
      hoverLayer.current = null;
    }
    if (hoveredLineupId && activeTab === 'view') {
      const lineup = lineups.find((l) => l.id === hoveredLineupId);
      if (lineup && lineup.agentPos && lineup.skillPos && lineup.id !== selectedLineupId) {
        const viewAgentPos = transformPos(lineup.agentPos);
        const viewSkillPos = transformPos(lineup.skillPos);
        const line = L.polyline([viewAgentPos, viewSkillPos], { color: 'white', weight: 2, dashArray: '5, 5', opacity: 0.7 }).addTo(map);
        hoverLayer.current = line;
      }
    }
  }, [hoveredLineupId, lineups, activeTab, selectedLineupId, isFlipped]);

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
