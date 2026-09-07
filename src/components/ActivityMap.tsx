import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import L from "leaflet";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import ActivityCard from "@/components/ActivityCard";
import ActivityFilters, { type RadiusOption } from "@/components/ActivityFilters";
import {
  AGE_RANGES,
  CATEGORY_ICONS,
  LUXEMBOURG_CENTER,
  type MapActivity,
} from "@/lib/activity-categories";
import { trackEvent } from "@/lib/analytics";
import { normalizeText } from "@/lib/text";

const WEEKDAYS_PT = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"] as const;

function weekdayName(date: Date): string {
  return WEEKDAYS_PT[date.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6];
}

// schedule_info is free text (no structured date column exists), so
// today/tomorrow/weekend/next-week are best-effort keyword matches.
function matchesWhen(activity: MapActivity, when: string | null) {
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

function matchesAges(activity: MapActivity, ages: string[]) {
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

function filterActivities(
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

function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(",").filter(Boolean);
}

function serializeList(values: string[]): string | undefined {
  return values.length > 0 ? values.join(",") : undefined;
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

function distanceKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function ActivityMap() {
  // The URL is the source of truth for filters + map view, so they survive
  // navigating to an activity's detail page and back (including the browser's
  // back button) instead of resetting to defaults on remount.
  const search = useSearch({ from: "/explorar" });
  const navigate = useNavigate({ from: "/explorar" });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [activities, setActivities] = useState<MapActivity[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [center, setCenter] = useState<[number, number]>(() =>
    search.lat !== undefined && search.lng !== undefined
      ? [search.lat, search.lng]
      : LUXEMBOURG_CENTER,
  );
  const radius = (search.radius ?? null) as RadiusOption;
  const ages = useMemo(() => parseList(search.age), [search.age]);
  const categories = useMemo(() => parseList(search.type), [search.type]);
  const when = search.when ?? null;
  const city = search.city ?? null;

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    // Read once at mount time — a fresh mount (e.g. after navigating back
    // from a detail page) already reflects the restored URL.
    const initialCenter: [number, number] =
      search.lat !== undefined && search.lng !== undefined
        ? [search.lat, search.lng]
        : LUXEMBOURG_CENTER;
    const initialZoom = search.zoom ?? 11;
    const map = L.map(containerRef.current).setView(initialCenter, initialZoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;

    let zoomSyncTimeout: ReturnType<typeof setTimeout> | undefined;
    const syncZoom = () => {
      clearTimeout(zoomSyncTimeout);
      zoomSyncTimeout = setTimeout(() => {
        const zoom = map.getZoom();
        navigate({ search: (prev) => ({ ...prev, zoom }), replace: true });
      }, 400);
    };
    map.on("zoomend", syncZoom);

    return () => {
      clearTimeout(zoomSyncTimeout);
      map.off("zoomend", syncZoom);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let active = true;
    supabase
      .from("activities")
      .select(
        "id, name, category, latitude, longitude, age_min, age_max, is_recurring, schedule_info, languages, entry_type, city",
      )
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setStatus("Não foi possível carregar as atividades.");
          return;
        }
        setActivities((data ?? []) as MapActivity[]);
      });
    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(() => {
    return filterActivities(activities, { center, radius, categories, ages, when, city });
  }, [activities, center, radius, categories, ages, when, city]);

  const cities = useMemo(() => {
    const distinct = new Set<string>();
    for (const a of activities) {
      if (a.city) distinct.add(a.city);
    }
    return Array.from(distinct).sort((a, b) => a.localeCompare(b, "pt"));
  }, [activities]);

  const toggleAge = (id: string) => {
    if (!ages.includes(id)) trackEvent("filter_applied", { filter_type: "age", filter_value: id });
    const next = ages.includes(id) ? ages.filter((a) => a !== id) : [...ages, id];
    navigate({ search: (prev) => ({ ...prev, age: serializeList(next) }), replace: true });
  };

  const toggleCategory = (id: string) => {
    if (!categories.includes(id)) {
      trackEvent("filter_applied", { filter_type: "type", filter_value: id });
    }
    const next = categories.includes(id)
      ? categories.filter((c) => c !== id)
      : [...categories, id];
    navigate({ search: (prev) => ({ ...prev, type: serializeList(next) }), replace: true });
  };

  const handleRadiusChange = (value: RadiusOption) => {
    if (value !== null) {
      trackEvent("filter_applied", { filter_type: "location", filter_value: `${value}km` });
    }
    navigate({ search: (prev) => ({ ...prev, radius: value ?? undefined }), replace: true });
  };

  const handleWhenChange = (value: string | null) => {
    if (value !== null) trackEvent("filter_applied", { filter_type: "when", filter_value: value });
    navigate({ search: (prev) => ({ ...prev, when: value ?? undefined }), replace: true });
  };

  const handleCityChange = (value: string | null) => {
    if (value !== null) {
      trackEvent("filter_applied", { filter_type: "location", filter_value: "city" });
    }
    navigate({ search: (prev) => ({ ...prev, city: value ?? undefined }), replace: true });
  };

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = visible.map((a) => {
      const emoji = CATEGORY_ICONS[a.category] ?? "📍";
      const icon = L.divIcon({
        className: "",
        html: `<div style="font-size:22px;line-height:32px;width:32px;height:32px;text-align:center;border-radius:9999px;background:hsl(var(--card,0 0% 100%));box-shadow:0 2px 6px rgba(0,0,0,.25)">${emoji}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });
      return L.marker([a.latitude, a.longitude], { icon })
        .addTo(map)
        .bindTooltip(`${emoji} ${escapeHtml(a.name)}`, { direction: "top", offset: [0, -16] })
        .on("click", () => {
          navigate({ to: "/atividade/$id", params: { id: a.id } });
        });
    });
  }, [visible, navigate]);

  const locateMe = () => {
    if (!navigator.geolocation) {
      setStatus("Seu navegador não permite localização.");
      return;
    }
    setStatus("Buscando sua localização...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCenter(point);
        mapRef.current?.setView(point, 13);
        setStatus(null);
        navigate({
          search: (prev) => ({ ...prev, lat: point[0], lng: point[1], zoom: 13 }),
          replace: true,
        });
      },
      () => setStatus("Não conseguimos acessar sua localização."),
    );
  };

  return (
    <div className="flex h-full w-full flex-col">
      <ActivityFilters
        radius={radius}
        onRadiusChange={handleRadiusChange}
        onLocateMe={locateMe}
        hasCenter
        cities={cities}
        city={city}
        onCityChange={handleCityChange}
        ages={ages}
        onToggleAge={toggleAge}
        categories={categories}
        onToggleCategory={toggleCategory}
        when={when}
        onWhenChange={handleWhenChange}
        count={visible.length}
      />
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <div className="relative h-[45vh] shrink-0 md:h-full md:flex-1">
          <div ref={containerRef} className="h-full w-full" />
          {status && (
            <p className="absolute inset-x-0 top-3 z-[1000] mx-auto w-fit rounded-full bg-card px-3 py-1 text-xs text-muted-foreground shadow">
              {status}
            </p>
          )}
        </div>
        <aside className="flex-1 space-y-2 overflow-y-auto border-t border-border bg-background p-3 md:w-96 md:flex-none md:border-l md:border-t-0">
          {visible.length === 0 ? (
            <p className="p-3 text-center text-sm text-muted-foreground">
              Nenhuma atividade encontrada com esses filtros.
            </p>
          ) : (
            visible.map((a) => (
              <ActivityCard
                key={a.id}
                activity={a}
                distanceKm={distanceKm(center, [a.latitude, a.longitude])}
              />
            ))
          )}
        </aside>
      </div>
    </div>
  );
}
