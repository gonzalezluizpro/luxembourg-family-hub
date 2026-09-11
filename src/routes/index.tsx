import { createFileRoute, ClientOnly, Link } from "@tanstack/react-router";
import { Suspense, lazy, useEffect } from "react";
import { z } from "zod";
import CategoryRail from "@/components/home/CategoryRail";
import FloatingMapToggle from "@/components/home/FloatingMapToggle";
import SearchBar from "@/components/home/SearchBar";
import ActivityGrid from "@/components/home/ActivityGrid";
import { useExploreState } from "@/hooks/use-explore-state";
import { trackEvent } from "@/lib/analytics";

const ActivityMap = lazy(() => import("@/components/ActivityMap"));

// Filter/map state lives in the URL so it survives navigating to an
// activity's detail page and back (including the browser's back button).
// `age`/`type` are comma-separated lists (e.g. "4-6,7-9") to keep the URL
// readable. `view` toggles between the activity grid and the map — they're
// never shown at the same time (see FloatingMapToggle).
export const homeSearchSchema = z.object({
  city: z.string().optional(),
  age: z.string().optional(),
  type: z.string().optional(),
  when: z.string().optional(),
  radius: z.union([z.literal(5), z.literal(10), z.literal(20)]).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  zoom: z.number().optional(),
  view: z.enum(["grid", "map"]).optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: homeSearchSchema,
  head: () => ({
    meta: [
      { title: "FamilyLoop Luxembourg — Atividades para famílias" },
      {
        name: "description",
        content:
          "Encontre atividades, clubes, eventos, parques e lugares para famílias em Luxemburgo.",
      },
      {
        property: "og:title",
        content: "FamilyLoop Luxembourg — Atividades para famílias",
      },
      {
        property: "og:description",
        content:
          "Encontre atividades, clubes, eventos, parques e lugares para famílias em Luxemburgo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
      },
    ],
  }),
  component: Home,
});

function MapSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-muted">
      <p className="text-sm text-muted-foreground">Carregando o mapa...</p>
    </div>
  );
}

function Home() {
  const {
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
  } = useExploreState();

  useEffect(() => {
    trackEvent("page_view", { page_path: "/" });
  }, []);

  return (
    <main className="flex h-screen flex-col">
      <h1 className="sr-only">Atividades para famílias em Luxemburgo</h1>

      <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 pt-3">
        <span className="text-lg font-bold text-foreground">FamilyLoop</span>
        <Link
          to="/ajuda"
          className="rounded-full border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
        >
          Preciso de ajuda / Posso ajudar
        </Link>
      </div>

      <SearchBar
        cities={cities}
        city={city}
        onCityChange={handleCityChange}
        radius={radius}
        onRadiusChange={handleRadiusChange}
        onLocateMe={locateMe}
        ages={ages}
        onToggleAge={toggleAge}
        when={when}
        onWhenChange={handleWhenChange}
        onClearFilters={handleClearFilters}
        count={visible.length}
      />
      <CategoryRail categories={categories} onToggleCategory={toggleCategory} />

      {/* min-h-0: without it, this flex item defaults to min-height:auto and
          grows to fit its content instead of respecting the height h-screen
          gives it, which lets the whole page scroll instead of just the
          grid/map area. */}
      <div className="relative min-h-0 flex-1">
        {view === "map" ? (
          <ClientOnly fallback={<MapSkeleton />}>
            <Suspense fallback={<MapSkeleton />}>
              <ActivityMap
                activities={visible}
                center={center}
                city={city}
                initialZoom={search.zoom ?? 11}
                onZoomChange={setZoomInUrl}
                status={status}
              />
            </Suspense>
          </ClientOnly>
        ) : (
          <div className="h-full overflow-y-auto">
            <ActivityGrid activities={visible} center={center} />
          </div>
        )}
        <FloatingMapToggle view={view} onToggle={toggleView} />
      </div>
    </main>
  );
}
