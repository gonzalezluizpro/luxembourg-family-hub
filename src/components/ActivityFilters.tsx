import { useState } from "react";

export type RadiusOption = 5 | 10 | 20 | null;

type Props = {
  radius: RadiusOption;
  onRadiusChange: (radius: RadiusOption) => void;
  onLocateMe: () => void;
  onSearchPlace: (query: string) => void;
  hasCenter: boolean;
  searching?: boolean;
};

const RADII: Array<{ value: RadiusOption; label: string }> = [
  { value: 5, label: "5 km" },
  { value: 10, label: "10 km" },
  { value: 20, label: "20 km" },
];

export default function ActivityFilters({
  radius,
  onRadiusChange,
  onLocateMe,
  onSearchPlace,
  hasCenter,
  searching,
}: Props) {
  const [query, setQuery] = useState("");

  return (
    <section className="border-b border-border bg-card px-4 py-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Localização
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onLocateMe}
          className="rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          📍 Perto de mim
        </button>
        {RADII.map((r) => (
          <button
            key={r.label}
            type="button"
            disabled={!hasCenter}
            onClick={() => onRadiusChange(radius === r.value ? null : r.value)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40 ${
              radius === r.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-foreground hover:bg-muted"
            }`}
          >
            {r.label}
          </button>
        ))}
        {radius !== null && (
          <button
            type="button"
            onClick={() => onRadiusChange(null)}
            className="rounded-full px-3 py-1.5 text-sm text-muted-foreground underline"
          >
            Limpar
          </button>
        )}
        <form
          className="flex min-w-[200px] flex-1 items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (query.trim()) onSearchPlace(query.trim());
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cidade ou endereço"
            className="w-full rounded-full border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={searching}
            className="rounded-full border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            {searching ? "..." : "Buscar"}
          </button>
        </form>
      </div>
    </section>
  );
}
