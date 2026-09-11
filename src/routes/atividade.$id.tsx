import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, Globe, Navigation, Share2 } from "lucide-react";
import { toast } from "sonner";
import InterestButton from "@/components/InterestButton";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { trackEvent } from "@/lib/analytics";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  formatAgeRange,
  getEntryTypeConfig,
} from "@/lib/activity-categories";

type ActivityRow = Database["public"]["Tables"]["activities"]["Row"];
type Status = "loading" | "ready" | "not-found" | "error";

export const Route = createFileRoute("/atividade/$id")({
  head: () => ({
    meta: [{ title: "Atividade — FamilyLoop Luxembourg" }],
  }),
  component: AtividadeDetail,
});

function CenteredMessage({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
      <p className="text-sm text-muted-foreground">{children}</p>
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
    </div>
  );
}

function AtividadeDetail() {
  const { id } = Route.useParams();
  const [activity, setActivity] = useState<ActivityRow | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let active = true;
    setStatus("loading");
    supabase
      .from("activities")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setStatus("error");
          return;
        }
        if (!data) {
          setStatus("not-found");
          return;
        }
        setActivity(data);
        setStatus("ready");
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (activity) document.title = `${activity.name} — FamilyLoop Luxembourg`;
  }, [activity]);

  const handleShare = async () => {
    if (!activity) return;
    trackEvent("share_click", { activity_name: activity.name });
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: activity.name, url });
      } catch {
        // User cancelled the native share sheet — not an error.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };

  if (status === "loading") {
    return <CenteredMessage>Carregando atividade...</CenteredMessage>;
  }
  if (status === "not-found") {
    return <CenteredMessage>Atividade não encontrada.</CenteredMessage>;
  }
  if (status === "error" || !activity) {
    return <CenteredMessage>Não foi possível carregar essa atividade.</CenteredMessage>;
  }

  const emoji = CATEGORY_ICONS[activity.category] ?? "📍";
  const categoryLabel = CATEGORY_LABELS[activity.category] ?? activity.category;
  const entryType = getEntryTypeConfig(activity.entry_type);
  const languages = activity.languages?.filter(Boolean) ?? [];
  const directionsUrl =
    activity.latitude !== null && activity.longitude !== null
      ? `https://www.google.com/maps/dir/?api=1&destination=${activity.latitude},${activity.longitude}`
      : null;

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-background px-4 py-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {emoji} {categoryLabel}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">{activity.name}</h1>
        </div>
        <span
          className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${entryType.className}`}
        >
          {entryType.label}
        </span>
      </div>

      <div className="mt-4">
        <InterestButton activityId={activity.id} activityName={activity.name} />
      </div>

      {activity.description && (
        <p className="mt-4 text-sm text-foreground">{activity.description}</p>
      )}

      <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DetailRow
          label="Faixa etária"
          value={formatAgeRange(activity.age_min, activity.age_max)}
        />
        <DetailRow
          label="Frequência"
          value={activity.is_recurring ? "🔁 Recorrente" : "📅 Evento único"}
        />
        <DetailRow
          label="Idiomas"
          value={languages.length > 0 ? languages.join(", ") : "Não informado"}
        />
        <DetailRow label="Cidade" value={activity.city ?? "Não informada"} />
        {activity.schedule_info && <DetailRow label="Horário" value={activity.schedule_info} />}
        {activity.price_info && <DetailRow label="Preço" value={activity.price_info} />}
        {activity.source_name && <DetailRow label="Fonte" value={activity.source_name} />}
      </dl>

      <div className="mt-8 flex flex-wrap gap-3">
        {activity.source_url && (
          <a
            href={activity.source_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("website_click", { activity_name: activity.name })}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Globe className="h-4 w-4" />
            Website
          </a>
        )}
        {directionsUrl && (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("directions_click", { activity_name: activity.name })}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Navigation className="h-4 w-4" />
            Como chegar
          </a>
        )}
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Share2 className="h-4 w-4" />
          Compartilhar
        </button>
      </div>
    </main>
  );
}
