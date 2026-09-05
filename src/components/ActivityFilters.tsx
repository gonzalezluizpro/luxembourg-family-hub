import { useState } from "react";
import {
  AGE_RANGES,
  CATEGORY_ICONS,
  CATEGORY_KEYS,
  CATEGORY_LABELS,
  WHEN_OPTIONS,
} from "@/lib/activity-categories";

export type RadiusOption = 5 | 10 | 20 | null;

type Props = {
  radius: RadiusOption;
  onRadiusChange: (radius: RadiusOption) => void;
  onLocateMe: () => void;
  onSearchPlace: (query: string) => void;
  hasCenter: boolean;
  searching?: boolean;
  ages: string[];
  onToggleAge: (id: string) => void;
  categories: string[];
  onToggleCategory: (id: string) => void;
  when: string | null;
  onWhenChange: (id: string | null) => void;
  count: number;
};

const RADII: Array<{ value: RadiusOption; label: string }> = [
  { value: 5, label: "5 km" },
  { value: 10, label: "10 km" },
  { value: 20, label: "20 km" },
];

function Chip({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40 ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background text-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export default function ActivityFilters({
  radius,
  onRadiusChange,
  onLocateMe,
  onSearchPlace,
  hasCenter,
  searching,
  ages,
  onToggleAge,
  categories,
  onToggleCategory,
  when,
  onWhenChange,
  count,
}: Props) {
  const [query, setQuery] = useState("");

  return (
    <section className="space-y-3 border-b border-border bg-card px-4 py-3">
      <Group title="Localização">
        <button
          type="button"
          onClick={onLocateMe}
          className="rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          📍 Perto de mim
        </button>
        {RADII.map((r) => (
          <Chip
            key={r.label}
            active={radius === r.value}
            disabled={!hasCenter}
            onClick={() => onRadiusChange(radius === r.value ? null : r.value)}
          >
            {r.label}
          </Chip>
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
      </Group>

      <Group title="Idade">
        {AGE_RANGES.map((r) => (
          <Chip key={r.id} active={ages.includes(r.id)} onClick={() => onToggleAge(r.id)}>
            {r.label}
          </Chip>
        ))}
      </Group>

      <Group title="Tipo">
        {CATEGORY_KEYS.map((key) => (
          <Chip
            key={key}
            active={categories.includes(key)}
            onClick={() => onToggleCategory(key)}
          >
            {CATEGORY_ICONS[key]} {CATEGORY_LABELS[key]}
          </Chip>
        ))}
      </Group>

      <Group title="Quando">
        {WHEN_OPTIONS.map((o) => (
          <Chip
            key={o.id}
            active={when === o.id}
            onClick={() => onWhenChange(when === o.id ? null : o.id)}
          >
            {o.label}
          </Chip>
        ))}
      </Group>

      <p className="text-sm font-medium text-foreground">
        {count} {count === 1 ? "atividade encontrada" : "atividades encontradas"}
      </p>
    </section>
  );
}
