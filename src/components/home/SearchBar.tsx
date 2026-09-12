import { useState } from "react";
import { ChevronDown, MapPin, SlidersHorizontal } from "lucide-react";
import CityCombobox, { type RadiusOption } from "@/components/CityCombobox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AGE_RANGES, WHEN_OPTIONS } from "@/lib/activity-categories";

const RADII: Array<{ value: RadiusOption; label: string }> = [
  { value: 5, label: "5 km" },
  { value: 10, label: "10 km" },
  { value: 20, label: "20 km" },
];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background text-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </span>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function SegmentButton({ label, value }: { label: string; value: string }) {
  return (
    <PopoverTrigger asChild>
      <button
        type="button"
        className="flex min-w-[150px] flex-col items-start justify-center gap-1 px-4 py-2 text-left transition-colors hover:bg-muted"
      >
        <FieldLabel>{label}</FieldLabel>
        <span className="flex w-full items-center gap-1 text-sm font-medium text-foreground">
          <span className="max-w-[170px] truncate">{value}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </span>
      </button>
    </PopoverTrigger>
  );
}

type Props = {
  cities: string[];
  city: string | null;
  onCityChange: (city: string | null) => void;
  radius: RadiusOption;
  onRadiusChange: (radius: RadiusOption) => void;
  onLocateMe: () => void;
  ages: string[];
  onToggleAge: (id: string) => void;
  when: string | null;
  onWhenChange: (id: string | null) => void;
  onClearFilters: () => void;
  count: number;
};

export default function SearchBar({
  cities,
  city,
  onCityChange,
  radius,
  onRadiusChange,
  onLocateMe,
  ages,
  onToggleAge,
  when,
  onWhenChange,
  onClearFilters,
  count,
}: Props) {
  const [ageOpen, setAgeOpen] = useState(false);
  const [whenOpen, setWhenOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const ageLabel =
    ages.length === 0
      ? "Qualquer idade"
      : ages
          .map((id) => AGE_RANGES.find((r) => r.id === id)?.label)
          .filter(Boolean)
          .join(", ");
  const whenLabel = WHEN_OPTIONS.find((o) => o.id === when)?.label ?? "Quando";

  // The commune field stays visible next to the mobile "Filtros" button, so
  // it isn't counted in that button's badge — only what's hidden inside the
  // sheet counts, otherwise the badge would flag a filter already on screen.
  const sheetFilterCount = ages.length + (when !== null ? 1 : 0) + (radius !== null ? 1 : 0);
  const activeFilterCount = sheetFilterCount + (city !== null ? 1 : 0);

  const ageChips = AGE_RANGES.map((r) => (
    <Chip key={r.id} active={ages.includes(r.id)} onClick={() => onToggleAge(r.id)}>
      {r.label}
    </Chip>
  ));

  const whenChips = WHEN_OPTIONS.map((o) => (
    <Chip
      key={o.id}
      active={when === o.id}
      onClick={() => onWhenChange(when === o.id ? null : o.id)}
    >
      {o.label}
    </Chip>
  ));

  const radiusChips = RADII.map((r) => (
    <Chip
      key={r.label}
      active={radius === r.value}
      onClick={() => onRadiusChange(radius === r.value ? null : r.value)}
    >
      {r.label}
    </Chip>
  ));

  return (
    <div className="border-b border-border bg-card px-4 py-3 sm:px-6 sm:py-4">
      <div className="hidden divide-x divide-border overflow-hidden rounded-xl border border-border bg-background shadow-sm md:inline-flex md:items-stretch">
        {/* CityCombobox manages its own Popover internally (the input doubles
            as its anchor), so it isn't wrapped in one here like the other
            segments. */}
        <div className="flex w-[240px] flex-col justify-center gap-0.5 px-4 py-2">
          <FieldLabel>Comuna</FieldLabel>
          <CityCombobox
            cities={cities}
            city={city}
            onCityChange={onCityChange}
            variant="segment"
          />
        </div>

        <Popover open={ageOpen} onOpenChange={setAgeOpen}>
          <SegmentButton label="Faixa etária" value={ageLabel} />
          {/* w-auto: the five short age chips fit one tidy row, where a fixed
              width leaves the last one stranded on a half-empty second row. */}
          <PopoverContent className="w-auto rounded-xl" align="start">
            <FilterGroup title="Idade">{ageChips}</FilterGroup>
          </PopoverContent>
        </Popover>

        <Popover open={whenOpen} onOpenChange={setWhenOpen}>
          <SegmentButton label="Data" value={whenLabel} />
          <PopoverContent className="w-72 rounded-xl" align="start">
            <FilterGroup title="Quando">{whenChips}</FilterGroup>
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-2 px-3">
          <button
            type="button"
            onClick={onLocateMe}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <MapPin className="h-4 w-4" />
            Perto de mim
          </button>
          {radiusChips}
        </div>
      </div>

      <div className="flex items-center gap-2 md:hidden">
        <div className="min-w-0 flex-1">
          <CityCombobox cities={cities} city={city} onCityChange={onCityChange} />
        </div>

        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex shrink-0 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
              {sheetFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-primary px-1 text-xs font-semibold text-primary-foreground">
                  {sheetFilterCount}
                </span>
              )}
            </button>
          </SheetTrigger>

          <SheetContent
            side="right"
            aria-describedby={undefined}
            className="flex w-[85%] flex-col gap-0 p-0 sm:max-w-sm"
          >
            <div className="border-b border-border px-4 py-4">
              <SheetTitle>Filtros</SheetTitle>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
              <FilterGroup title="Faixa etária">{ageChips}</FilterGroup>
              <FilterGroup title="Quando">{whenChips}</FilterGroup>
              <FilterGroup title="Distância">{radiusChips}</FilterGroup>

              <button
                type="button"
                onClick={onLocateMe}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <MapPin className="h-4 w-4" />
                Usar minha localização
              </button>
            </div>

            <div className="flex items-center gap-3 border-t border-border px-4 py-3">
              <button
                type="button"
                onClick={onClearFilters}
                className="shrink-0 px-1 text-sm font-medium text-muted-foreground underline transition-colors hover:text-foreground"
              >
                Limpar
              </button>
              <SheetClose asChild>
                <button
                  type="button"
                  className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {count === 0
                    ? "Nenhuma atividade"
                    : `Ver ${count} ${count === 1 ? "atividade" : "atividades"}`}
                </button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">
          {count} {count === 1 ? "atividade encontrada" : "atividades encontradas"}
        </p>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onClearFilters}
            className="shrink-0 text-sm font-medium text-muted-foreground underline hover:text-foreground"
          >
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}
