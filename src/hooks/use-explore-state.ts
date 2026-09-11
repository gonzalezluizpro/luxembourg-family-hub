import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LUXEMBOURG_CENTER, type MapActivity } from "@/lib/activity-categories";
import { filterActivities, parseList, serializeList } from "@/lib/activity-filters";
import { trackEvent } from "@/lib/analytics";
import type { RadiusOption } from "@/components/CityCombobox";

export type ViewMode = "grid" | "map";

// Filter/map state lives in the URL (validated by the "/" route's search
// schema) so it survives navigating to an activity's detail page and back,
// including the browser's back button — see src/routes/index.tsx.
export function useExploreState() {
  const search = useSearch({ from: "/" });
  const navigate = useNavigate({ from: "/" });
  const [activities, setActivities] = useState<MapActivity[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [locatedCenter, setLocatedCenter] = useState<[number, number] | null>(
    search.lat !== undefined && search.lng !== undefined ? [search.lat, search.lng] : null,
  );

  const radius = (search.radius ?? null) as RadiusOption;
  const ages = useMemo(() => parseList(search.age), [search.age]);
  const categories = useMemo(() => parseList(search.type), [search.type]);
  const when = search.when ?? null;
  const city = search.city ?? null;
  const view: ViewMode = search.view ?? "grid";
  const center = locatedCenter ?? LUXEMBOURG_CENTER;

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
    if (!ages.includes(id)) trackEvent("search_used", { filter_type: "age", filter_value: id });
    const next = ages.includes(id) ? ages.filter((a) => a !== id) : [...ages, id];
    navigate({ search: (prev) => ({ ...prev, age: serializeList(next) }), replace: true });
  };

  const toggleCategory = (id: string) => {
    if (!categories.includes(id)) {
      trackEvent("category_clicked", { category: id });
    }
    const next = categories.includes(id)
      ? categories.filter((c) => c !== id)
      : [...categories, id];
    navigate({ search: (prev) => ({ ...prev, type: serializeList(next) }), replace: true });
  };

  const handleRadiusChange = (value: RadiusOption) => {
    if (value !== null) {
      trackEvent("search_used", { filter_type: "location", filter_value: `${value}km` });
    }
    navigate({ search: (prev) => ({ ...prev, radius: value ?? undefined }), replace: true });
  };

  const handleWhenChange = (value: string | null) => {
    if (value !== null) trackEvent("search_used", { filter_type: "when", filter_value: value });
    navigate({ search: (prev) => ({ ...prev, when: value ?? undefined }), replace: true });
  };

  const handleCityChange = (value: string | null) => {
    if (value !== null) {
      trackEvent("search_used", { filter_type: "city", filter_value: value });
    }
    navigate({ search: (prev) => ({ ...prev, city: value ?? undefined }), replace: true });
  };

  // Clears only the filter params — map position/zoom (lat/lng/zoom) is
  // viewport state, not a filter, so it's left untouched.
  const handleClearFilters = () => {
    trackEvent("clear_filters");
    navigate({
      search: (prev) => ({ lat: prev.lat, lng: prev.lng, zoom: prev.zoom, view: prev.view }),
      replace: true,
    });
  };

  const toggleView = () => {
    const next: ViewMode = view === "grid" ? "map" : "grid";
    trackEvent("map_toggled", { view: next });
    navigate({ search: (prev) => ({ ...prev, view: next }), replace: true });
  };

  const locateMe = () => {
    if (!navigator.geolocation) {
      setStatus("Seu navegador não permite localização.");
      return;
    }
    setStatus("Buscando sua localização...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setLocatedCenter(point);
        setStatus(null);
        navigate({
          search: (prev) => ({ ...prev, lat: point[0], lng: point[1], zoom: 13 }),
          replace: true,
        });
      },
      () => setStatus("Não conseguimos acessar sua localização."),
    );
  };

  const setZoomInUrl = (zoom: number) => {
    navigate({ search: (prev) => ({ ...prev, zoom }), replace: true });
  };

  return {
    activities,
    visible,
    cities,
    center,
    status,
    radius,
    ages,
    categories,
    when,
    city,
    view,
    search,
    toggleAge,
    toggleCategory,
    handleRadiusChange,
    handleWhenChange,
    handleCityChange,
    handleClearFilters,
    toggleView,
    locateMe,
    setZoomInUrl,
  };
}
