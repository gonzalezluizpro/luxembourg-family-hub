import { useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import CityCombobox, { type RadiusOption } from "@/components/CityCombobox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AGE_RANGES, WHEN_OPTIONS } from "@/lib/activity-categories";

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

function SegmentButton({ label, value }: { label: string; value: string }) {
  return (
    <PopoverTrigger asChild>
      <button
        type="button"
        className="flex min-w-[132px] flex-col items-start rounded-full px-4 py-2 text-left transition-colors hover:bg-muted"
      >
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="flex items-center gap-1 text-sm font-medium text-foreground">
          {value}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
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

  const ageLabel =
    ages.length === 0
      ? "Qualquer idade"
      : ages
          .map((id) => AGE_RANGES.find((r) => r.id === id)?.label)
          .filter(Boolean)
          .join(", ");
  const whenLabel = WHEN_OPTIONS.find((o) => o.id === when)?.label ?? "Quando";

  const activeFilterCount =
    (radius !== null ? 1 : 0) + ages.length + (when !== null ? 1 : 0) + (city !== null ? 1 : 0);

  return (
    <div className="border-b border-border bg-card px-4 py-3">
      <div className="flex flex-wrap items-center gap-1 rounded-full border border-border bg-background p-1 shadow-sm md:inline-flex md:w-auto">
        {/* CityCombobox manages its own Popover internally (the input doubles
            as its anchor), so it isn't wrapped in one here like the other
            segments. */}
        <div className="flex min-w-[180px] flex-1 flex-col px-3 py-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Comuna
          </span>
          <CityCombobox cities={cities} city={city} onCityChange={onCityChange} />
        </div>

        <div className="hidden h-8 w-px bg-border md:block" />

        <Popover open={ageOpen} onOpenChange={setAgeOpen}>
          <SegmentButton label="Faixa etária" value={ageLabel} />
          <PopoverContent className="w-72" align="start">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Idade
            </p>
            <div className="flex flex-wrap gap-2">
              {AGE_RANGES.map((r) => (
                <Chip key={r.id} active={ages.includes(r.id)} onClick={() => onToggleAge(r.id)}>
                  {r.label}
                </Chip>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="hidden h-8 w-px bg-border md:block" />

        <Popover open={whenOpen} onOpenChange={setWhenOpen}>
          <SegmentButton label="Data" value={whenLabel} />
          <PopoverContent className="w-72" align="start">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Quando
            </p>
            <div className="flex flex-wrap gap-2">
              {WHEN_OPTIONS.map((o) => (
                <Chip
                  key={o.id}
                  active={when === o.id}
                  onClick={() => onWhenChange(when === o.id ? null : o.id)}
                >
                  {o.label}
                </Chip>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <button
          type="button"
          onClick={onLocateMe}
          className="ml-1 flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <MapPin className="h-4 w-4" />
          Perto de mim
        </button>
        <div className="flex shrink-0 items-center gap-1">
          {RADII.map((r) => (
            <Chip
              key={r.label}
              active={radius === r.value}
              onClick={() => onRadiusChange(radius === r.value ? null : r.value)}
            >
              {r.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 px-1">
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
