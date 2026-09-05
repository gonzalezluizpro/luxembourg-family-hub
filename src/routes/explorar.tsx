import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/explorar")({
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
  }),
  component: Explorar,
});

function Explorar() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <p className="text-muted-foreground">Mapa de atividades em breve...</p>
    </main>
  );
}
