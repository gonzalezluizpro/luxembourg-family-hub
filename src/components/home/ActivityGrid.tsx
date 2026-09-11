import ActivityCard from "@/components/ActivityCard";
import { distanceKm } from "@/lib/activity-filters";
import type { MapActivity } from "@/lib/activity-categories";

type Props = {
  activities: MapActivity[];
  center: [number, number];
};

export default function ActivityGrid({ activities, center }: Props) {
  if (activities.length === 0) {
    return (
      <p className="p-6 text-center text-sm text-muted-foreground">
        Nenhuma atividade encontrada com esses filtros.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-3">
      {activities.map((a) => (
        <ActivityCard key={a.id} activity={a} distanceKm={distanceKm(center, [a.latitude, a.longitude])} />
      ))}
    </div>
  );
}
