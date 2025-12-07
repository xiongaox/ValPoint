import { useEffect, useState } from 'react';
import { CUSTOM_MAP_URLS, MAP_TRANSLATIONS } from '../constants/maps';

export function useValorantData() {
  const [maps, setMaps] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedMap, setSelectedMap] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);

  useEffect(() => {
    // 拉取地图并设置默认地图
    fetch('https://valorant-api.com/v1/maps')
      .then((res) => res.json())
      .then((data: any) => {
        const validMaps = (data?.data || []).filter((m: any) => {
          const name = m?.displayName;
          return MAP_TRANSLATIONS[name] || (CUSTOM_MAP_URLS as Record<string, any>)[name];
        });
        setMaps(validMaps);
        if (validMaps.length > 0) {
          const ascent = validMaps.find((m: any) => m.displayName === 'Ascent');
          setSelectedMap(ascent || validMaps[0]);
        }
      });

    // 拉取特工并设置默认特工
    fetch('https://valorant-api.com/v1/agents?language=zh-CN&isPlayableCharacter=true')
      .then((res) => res.json())
      .then((data: any) => {
        const sorted = (data?.data || []).sort((a: any, b: any) => a.displayName.localeCompare(b.displayName));
        setAgents(sorted);
        const sova = sorted.find((a: any) => a.displayName === '猎枭' || a.displayName === 'Sova');
        if (sova) setSelectedAgent(sova);
        else if (sorted.length > 0) setSelectedAgent(sorted[0]);
      });
  }, []);

  return {
    maps,
    setMaps,
    agents,
    setAgents,
    selectedMap,
    setSelectedMap,
    selectedAgent,
    setSelectedAgent,
  };
}
