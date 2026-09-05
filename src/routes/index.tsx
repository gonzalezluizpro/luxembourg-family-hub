import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
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
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-hero-from via-background to-hero-to opacity-80" />
      <div className="mx-auto max-w-2xl space-y-8">
        <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          O que fazer com seus filhos perto de você?
        </h1>
        <p className="text-balance text-lg text-muted-foreground sm:text-xl">
          Encontre atividades, clubes, eventos, parques e lugares para famílias
          em Luxemburgo
        </p>
        <Link
          to="/explorar"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95"
        >
          <span aria-hidden>📍</span>
          Explorar perto de mim
        </Link>
      </div>
    </main>
  );
}
