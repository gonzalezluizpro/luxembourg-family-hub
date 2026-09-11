import { AGE_RANGES, type MapActivity } from "@/lib/activity-categories";
import { normalizeText } from "@/lib/text";

const WEEKDAYS_PT = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"] as const;

function weekdayName(date: Date): string {
  return WEEKDAYS_PT[date.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6];
}

// schedule_info is free text (no structured date column exists), so
// today/tomorrow/weekend/next-week are best-effort keyword matches.
export function matchesWhen(activity: MapActivity, when: string | null) {
  if (!when) return true;
  if (when === "recurring") return activity.is_recurring === true;

  const info = normalizeText(activity.schedule_info ?? "");
  const now = new Date();

  if (when === "today") {
    return info.includes(weekdayName(now)) || info.includes("hoje");
  }
  if (when === "tomorrow") {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return info.includes(weekdayName(tomorrow)) || info.includes("amanha");
  }
  if (when === "weekend") {
    return (
      info.includes(WEEKDAYS_PT[0]) ||
      info.includes(WEEKDAYS_PT[6]) ||
      info.includes("fim de semana")
    );
  }
  if (when === "next-week") {
    return info.includes("proxima semana") || activity.is_recurring === true;
  }
  return true;
}

export function matchesAges(activity: MapActivity, ages: string[]) {
  if (ages.length === 0) return true;
  if (activity.age_min === null && activity.age_max === null) return true;
  const activityMin = activity.age_min ?? 0;
  const activityMax = activity.age_max ?? 99;
  return ages.some((id) => {
    const range = AGE_RANGES.find((r) => r.id === id);
    if (!range) return false;
    return activityMin <= range.max && activityMax >= range.min;
  });
}

export function distanceKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function filterActivities(
  activities: MapActivity[],
  filters: {
    center: [number, number] | null;
    radius: number | null;
    categories: string[];
    ages: string[];
    when: string | null;
    city: string | null;
  },
) {
  const { center, radius, categories, ages, when, city } = filters;
  return activities.filter((a) => {
    if (center && radius !== null && distanceKm(center, [a.latitude, a.longitude]) > radius) {
      return false;
    }
    if (city !== null && a.city !== city) return false;
    if (categories.length > 0 && !categories.includes(a.category)) return false;
    if (!matchesAges(a, ages)) return false;
    if (!matchesWhen(a, when)) return false;
    return true;
  });
}

export function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(",").filter(Boolean);
}

export function serializeList(values: string[]): string | undefined {
  return values.length > 0 ? values.join(",") : undefined;
}
