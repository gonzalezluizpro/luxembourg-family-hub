import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy, useEffect } from "react";
import { z } from "zod";
import { trackEvent } from "@/lib/analytics";

const ActivityMap = lazy(() => import("@/components/ActivityMap"));

// Filter/map state lives in the URL so it survives navigating to an activity's
// detail page and back (including the browser's back button). `age`/`type` are
// comma-separated lists (e.g. "4-6,7-9") to keep the URL readable.
export const explorarSearchSchema = z.object({
  city: z.string().optional(),
  age: z.string().optional(),
  type: z.string().optional(),
  when: z.string().optional(),
  radius: z.union([z.literal(5), z.literal(10), z.literal(20)]).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  zoom: z.number().optional(),
});

export const Route = createFileRoute("/explorar")({
  validateSearch: explorarSearchSchema,
  head: () => ({
    meta: [
      { title: "Explorar — FamilyLoop Luxembourg" },
      {
        name: "description",
        content: "Descubra atividades e lugares para famílias perto de você.",
      },
      { property: "og:title", content: "Explorar — FamilyLoop Luxembourg" },
      {
        property: "og:description",
        content: "Descubra atividades e lugares para famílias perto de você.",
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
  component: Explorar,
});

function MapSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-muted">
      <p className="text-sm text-muted-foreground">Carregando o mapa...</p>
    </div>
  );
}

function Explorar() {
  useEffect(() => {
    trackEvent("page_view", { page_path: "/explorar" });
  }, []);

  return (
    <main className="flex h-screen flex-col">
      <h1 className="sr-only">Explorar atividades para famílias em Luxemburgo</h1>
      {/* min-h-0: without it, this flex item defaults to min-height:auto and
          grows to fit ActivityMap's content (the activity list) instead of
          respecting the height h-screen gives it — which is what let the
          whole page scroll instead of just the <aside> list. */}
      <div className="min-h-0 flex-1">
        <ClientOnly fallback={<MapSkeleton />}>
          <Suspense fallback={<MapSkeleton />}>
            <ActivityMap />
          </Suspense>
        </ClientOnly>
      </div>
    </main>
  );
}
