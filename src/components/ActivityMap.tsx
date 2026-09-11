import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import L from "leaflet";
import { useNavigate } from "@tanstack/react-router";
import { CATEGORY_ICONS, type MapActivity } from "@/lib/activity-categories";

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

type Props = {
  activities: MapActivity[];
  center: [number, number];
  city: string | null;
  initialZoom?: number;
  onZoomChange: (zoom: number) => void;
  status: string | null;
};

// Purely presentational: filtering, URL/search-param state and data fetching
// all live in useExploreState (src/hooks/use-explore-state.ts) so this
// component can be swapped for the grid view without duplicating that logic.
export default function ActivityMap({
  activities,
  center,
  city,
  initialZoom = 11,
  onZoomChange,
  status,
}: Props) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const didMountRef = useRef(false);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const map = L.map(containerRef.current).setView(center, initialZoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;

    let zoomSyncTimeout: ReturnType<typeof setTimeout> | undefined;
    const syncZoom = () => {
      clearTimeout(zoomSyncTimeout);
      zoomSyncTimeout = setTimeout(() => onZoomChange(map.getZoom()), 400);
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

  // Recenters when the user picks a new location (e.g. "Perto de mim") while
  // the map is already mounted — the effect above only sets the view once,
  // at mount time.
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    mapRef.current?.setView(center, 13);
  }, [center]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = activities.map((a) => {
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
  }, [activities, navigate]);

  // When a commune filter is active, frame the map on the filtered results
  // instead of leaving it at whatever view it happened to be at — otherwise
  // switching to the map with a commune selected showed the default/initial
  // view instead of that commune's activities. No commune filter -> leave
  // the current view alone (the user may have manually panned/zoomed).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || city === null || activities.length === 0) return;
    const bounds = L.latLngBounds(activities.map((a): [number, number] => [a.latitude, a.longitude]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [activities, city]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {status && (
        <p className="absolute inset-x-0 top-3 z-[1000] mx-auto w-fit rounded-full bg-card px-3 py-1 text-xs text-muted-foreground shadow">
          {status}
        </p>
      )}
    </div>
  );
}
