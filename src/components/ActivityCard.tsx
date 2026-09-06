import { Link } from "@tanstack/react-router";
import InterestButton from "@/components/InterestButton";
import { trackEvent } from "@/lib/analytics";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  formatAgeRange,
  formatDistance,
  getEntryTypeConfig,
  type MapActivity,
} from "@/lib/activity-categories";

type ActivityCardProps = {
  activity: MapActivity;
  distanceKm: number | null;
};

export default function ActivityCard({ activity, distanceKm }: ActivityCardProps) {
  const emoji = CATEGORY_ICONS[activity.category] ?? "📍";
  const categoryLabel = CATEGORY_LABELS[activity.category] ?? activity.category;
  const entryType = getEntryTypeConfig(activity.entry_type);
  const distanceLabel = formatDistance(distanceKm);
  const languages = activity.languages?.filter(Boolean) ?? [];

  return (
    <div className="rounded-xl border border-border bg-card p-3 text-card-foreground shadow-sm">
      <Link
        to="/atividade/$id"
        params={{ id: activity.id }}
        onClick={() => trackEvent("activity_card_click", { activity_name: activity.name })}
        className="block transition-colors hover:opacity-80"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-snug">{activity.name}</h3>
          <span
            className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${entryType.className}`}
          >
            {entryType.label}
          </span>
        </div>

        <p className="mt-1 text-xs text-muted-foreground">
          {emoji} {categoryLabel}
          {distanceLabel ? ` · ${distanceLabel}` : ""}
        </p>

        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>🧒 {formatAgeRange(activity.age_min, activity.age_max)}</span>
          <span>{activity.is_recurring ? "🔁 Recorrente" : "📅 Evento único"}</span>
          <span>🗣️ {languages.length > 0 ? languages.join(", ") : "Idioma não informado"}</span>
        </div>
      </Link>

      <div className="mt-2 border-t border-border pt-2">
        <InterestButton activityId={activity.id} activityName={activity.name} size="sm" />
      </div>
    </div>
  );
}
