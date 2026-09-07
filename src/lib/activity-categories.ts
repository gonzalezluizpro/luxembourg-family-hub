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

// Mirrors the `entry_type` CHECK constraint in the activities table.
export const ENTRY_TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  open: {
    label: "Aberto a todos",
    className: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-400",
  },
  registration_required: {
    label: "Inscrição necessária",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-400",
  },
  contact_required: {
    label: "Contato necessário",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-400",
  },
  members_only: {
    label: "Apenas membros",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400",
  },
};

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
  languages: string[] | null;
  entry_type: string;
  city: string | null;
};

export const LUXEMBOURG_CENTER: [number, number] = [49.6116, 6.1319];

const FALLBACK_ENTRY_TYPE = {
  label: "Tipo de entrada não informado",
  className: "bg-muted text-muted-foreground",
};

export function getEntryTypeConfig(entryType: string) {
  return ENTRY_TYPE_CONFIG[entryType] ?? FALLBACK_ENTRY_TYPE;
}

export function formatDistance(distanceKm: number | null) {
  if (distanceKm === null) return null;
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m de você`;
  return `${distanceKm.toFixed(1).replace(".", ",")} km de você`;
}

export function formatAgeRange(ageMin: number | null, ageMax: number | null) {
  if (ageMin === null && ageMax === null) return "Idade não informada";
  if ((ageMin ?? 0) <= 0 && (ageMax ?? 99) >= 99) return "Todas as idades";
  if (ageMin !== null && ageMax !== null) return `${ageMin}–${ageMax} anos`;
  if (ageMin !== null) return `A partir de ${ageMin} anos`;
  return `Até ${ageMax} anos`;
}
