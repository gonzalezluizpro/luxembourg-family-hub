import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import L from "leaflet";
import { supabase } from "@/integrations/supabase/client";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  LUXEMBOURG_CENTER,
  type MapActivity,
} from "@/lib/activity-categories";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

export default function ActivityMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [activities, setActivities] = useState<MapActivity[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const map = L.map(containerRef.current).setView(LUXEMBOURG_CENTER, 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    let active = true;
    supabase
      .from("activities")
      .select("id, name, category, latitude, longitude")
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
        .bindPopup(
          `<strong>${escapeHtml(a.name)}</strong><br/>${emoji} ${escapeHtml(
            CATEGORY_LABELS[a.category] ?? a.category,
          )}`,
        );
    });
  }, [activities]);

  const locateMe = () => {
    if (!navigator.geolocation) {
      setStatus("Seu navegador não permite localização.");
      return;
    }
    setStatus("Buscando sua localização...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 14);
        setStatus(null);
      },
      () => setStatus("Não conseguimos acessar sua localização."),
    );
  };

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute inset-x-0 top-3 z-[1000] flex flex-col items-center gap-2 px-4">
        <button
          onClick={locateMe}
          className="pointer-events-auto rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
        >
          📍 Usar minha localização
        </button>
        {status && (
          <p className="pointer-events-auto rounded-full bg-card px-3 py-1 text-xs text-muted-foreground shadow">
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
