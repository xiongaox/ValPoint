import { zipSync, strToU8 } from 'fflate';
import { MAP_TRANSLATIONS } from '../constants/maps';
import { BaseLineup, LineupPosition } from '../types/lineup';
import { downloadImageBlob } from './imageBed/utils';

type LineupImageField = 'stand_img' | 'stand2_img' | 'aim_img' | 'aim2_img' | 'land_img';

type LineupImageSlot = {
  field: LineupImageField;
  prop: keyof BaseLineup;
};

export type LineupDownloadPayload = {
  id: string;
  user_id: string | null;
  title: string;
  map_name: string;
  agent_name: string;
  agent_icon?: string | null;
  skill_icon?: string | null;
  side: string;
  ability_index: number | null;
  agent_pos: LineupPosition | null;
  skill_pos: LineupPosition | null;
  stand_img?: string | null;
  stand_desc?: string | null;
  stand2_img?: string | null;
  stand2_desc?: string | null;
  aim_img?: string | null;
  aim_desc?: string | null;
  aim2_img?: string | null;
  aim2_desc?: string | null;
  land_img?: string | null;
  land_desc?: string | null;
  source_link?: string | null;
  cloned_from?: string | null;
  author_name?: string | null;
  author_avatar?: string | null;
  author_uid?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type LineupDownloadResult = {
  failedImages: LineupImageField[];
};

const imageSlots: LineupImageSlot[] = [
  { field: 'stand_img', prop: 'standImg' },
  { field: 'stand2_img', prop: 'stand2Img' },
  { field: 'aim_img', prop: 'aimImg' },
  { field: 'aim2_img', prop: 'aim2Img' },
  { field: 'land_img', prop: 'landImg' },
];

const imageNameMap: Record<LineupImageField, string> = {
  stand_img: '站位图.webp',
  stand2_img: '站位图2.webp',
  aim_img: '瞄点图.webp',
  aim2_img: '瞄点图2.webp',
  land_img: '技能落点图.webp',
};

const sanitizeFileName = (value: string) => {
  const trimmed = value.trim();
  const cleaned = trimmed.replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, ' ');
  return cleaned || '点位';
};

const resolveAbilityLabel = (abilityIndex: number | null) => {
  const labels = ['C', 'Q', 'E', 'X'];
  if (abilityIndex == null) return '技能';
  const label = labels[abilityIndex];
  return label ? `技能${label}` : '技能';
};

const triggerDownload = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const resolveImageValue = (fileName: string | null | undefined, originalUrl: string | null | undefined) => {
  if (fileName) return fileName;
  return originalUrl ?? null;
};

const buildPayload = (lineup: BaseLineup, imageFiles: Partial<Record<LineupImageField, string>>): LineupDownloadPayload => ({
  id: lineup.id,
  user_id: lineup.userId ?? null,
  title: lineup.title,
  map_name: lineup.mapName,
  agent_name: lineup.agentName,
  agent_icon: lineup.agentIcon ?? null,
  skill_icon: lineup.skillIcon ?? null,
  side: lineup.side,
  ability_index: lineup.abilityIndex ?? null,
  agent_pos: lineup.agentPos ?? null,
  skill_pos: lineup.skillPos ?? null,
  stand_img: resolveImageValue(imageFiles.stand_img, lineup.standImg),
  stand_desc: lineup.standDesc ?? null,
  stand2_img: resolveImageValue(imageFiles.stand2_img, lineup.stand2Img),
  stand2_desc: lineup.stand2Desc ?? null,
  aim_img: resolveImageValue(imageFiles.aim_img, lineup.aimImg),
  aim_desc: lineup.aimDesc ?? null,
  aim2_img: resolveImageValue(imageFiles.aim2_img, lineup.aim2Img),
  aim2_desc: lineup.aim2Desc ?? null,
  land_img: resolveImageValue(imageFiles.land_img, lineup.landImg),
  land_desc: lineup.landDesc ?? null,
  source_link: lineup.sourceLink ?? null,
  cloned_from: lineup.clonedFrom ?? null,
  author_name: lineup.authorName ?? null,
  author_avatar: lineup.authorAvatar ?? null,
  author_uid: lineup.authorUid ?? null,
  created_at: lineup.createdAt ?? null,
  updated_at: lineup.updatedAt ?? null,
});

export const downloadLineupBundle = async (lineup: BaseLineup): Promise<LineupDownloadResult> => {
  const abilityLabel = resolveAbilityLabel(lineup.abilityIndex ?? null);
  const mapLabel = MAP_TRANSLATIONS[lineup.mapName] || lineup.mapName;
  const zipBaseName = sanitizeFileName(
    `${mapLabel}_${lineup.agentName}_${abilityLabel}_${lineup.title || '点位'}`,
  );
  const imageFiles: Partial<Record<LineupImageField, string>> = {};
  const zipFiles: Record<string, Uint8Array> = {};
  const failedImages: LineupImageField[] = [];

  for (const slot of imageSlots) {
    const url = lineup[slot.prop] as string | null | undefined;
    if (!url) continue;
    try {
      const { blob } = await downloadImageBlob(url);
      const fileName = `images/${imageNameMap[slot.field]}`;
      const buffer = new Uint8Array(await blob.arrayBuffer());
      zipFiles[fileName] = buffer;
      imageFiles[slot.field] = fileName;
    } catch (error) {
      console.error(error);
      failedImages.push(slot.field);
    }
  }

  const payload = buildPayload(lineup, imageFiles);
  zipFiles[`${zipBaseName}.json`] = strToU8(JSON.stringify(payload, null, 2));
  const zipBytes = zipSync(zipFiles, { level: 9 });
  const zipData = new Uint8Array(zipBytes);
  const zipBlob = new Blob([zipData], { type: 'application/zip' });
  triggerDownload(zipBlob, `${zipBaseName}.zip`);

  return { failedImages };
};
