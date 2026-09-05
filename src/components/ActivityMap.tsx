import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import L from "leaflet";
import { supabase } from "@/integrations/supabase/client";
import ActivityFilters, { type RadiusOption } from "@/components/ActivityFilters";
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

function distanceKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function ActivityMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [activities, setActivities] = useState<MapActivity[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [radius, setRadius] = useState<RadiusOption>(null);
  const [searching, setSearching] = useState(false);

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

  const visible = useMemo(() => {
    if (!center || radius === null) return activities;
    return activities.filter(
      (a) => distanceKm(center, [a.latitude, a.longitude]) <= radius,
    );
  }, [activities, center, radius]);

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
        .bindPopup(
          `<strong>${escapeHtml(a.name)}</strong><br/>${emoji} ${escapeHtml(
            CATEGORY_LABELS[a.category] ?? a.category,
          )}`,
        );
    });
  }, [visible]);

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
      },
      () => setStatus("Não conseguimos acessar sua localização."),
    );
  };

  const searchPlace = async (query: string) => {
    setSearching(true);
    setStatus("Buscando endereço...");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
      );
      const data = (await res.json()) as Array<{ lat: string; lon: string }>;
      const first = data[0];
      if (!first) {
        setStatus("Nenhum lugar encontrado com esse nome.");
        return;
      }
      const point: [number, number] = [Number(first.lat), Number(first.lon)];
      setCenter(point);
      mapRef.current?.setView(point, 13);
      setStatus(null);
    } catch {
      setStatus("Não foi possível buscar esse endereço.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col">
      <ActivityFilters
        radius={radius}
        onRadiusChange={setRadius}
        onLocateMe={locateMe}
        onSearchPlace={searchPlace}
        hasCenter={center !== null}
        searching={searching}
      />
      <div className="relative flex-1">
        <div ref={containerRef} className="h-full w-full" />
        {status && (
          <p className="absolute inset-x-0 top-3 z-[1000] mx-auto w-fit rounded-full bg-card px-3 py-1 text-xs text-muted-foreground shadow">
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
