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

export type MapActivity = {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
};

export const LUXEMBOURG_CENTER: [number, number] = [49.6116, 6.1319];
