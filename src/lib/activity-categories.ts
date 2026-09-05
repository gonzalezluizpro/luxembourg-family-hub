export const CATEGORY_ICONS: Record<string, string> = {
  sport: "⚽",
  music: "🎵",
  art: "🎨",
  nature: "🌳",
  scouts: "🏕",
  culture: "🎭",
  swimming: "🏊",
  playground: "🛝",
  event: "👨‍👩‍👧",
  community: "🏛",
};

export const CATEGORY_LABELS: Record<string, string> = {
  sport: "Esporte",
  music: "Música",
  art: "Arte",
  nature: "Natureza",
  scouts: "Escoteiros",
  culture: "Cultura",
  swimming: "Natação",
  playground: "Parquinho",
  event: "Evento",
  community: "Comunidade",
};

export const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS);

export const AGE_RANGES: Array<{ id: string; label: string; min: number; max: number }> = [
  { id: "0-3", label: "0–3", min: 0, max: 3 },
  { id: "4-6", label: "4–6", min: 4, max: 6 },
  { id: "7-9", label: "7–9", min: 7, max: 9 },
  { id: "10-12", label: "10–12", min: 10, max: 12 },
  { id: "13+", label: "13+", min: 13, max: 99 },
];

export const WHEN_OPTIONS: Array<{ id: string; label: string }> = [
  { id: "today", label: "Hoje" },
  { id: "tomorrow", label: "Amanhã" },
  { id: "weekend", label: "Este fim de semana" },
  { id: "next-week", label: "Próxima semana" },
  { id: "recurring", label: "Recorrente" },
];

export type MapActivity = {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  age_min: number | null;
  age_max: number | null;
  is_recurring: boolean | null;
  schedule_info: string | null;
};

export const LUXEMBOURG_CENTER: [number, number] = [49.6116, 6.1319];
