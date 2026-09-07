import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Search, SlidersHorizontal } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import {
  AGE_RANGES,
  CATEGORY_ICONS,
  CATEGORY_KEYS,
  CATEGORY_LABELS,
  WHEN_OPTIONS,
} from "@/lib/activity-categories";
import { normalizeText } from "@/lib/text";
import { cn } from "@/lib/utils";

export type RadiusOption = 5 | 10 | 20 | null;

type Props = {
  radius: RadiusOption;
  onRadiusChange: (radius: RadiusOption) => void;
  onLocateMe: () => void;
  hasCenter: boolean;
  cities: string[];
  city: string | null;
  onCityChange: (city: string | null) => void;
  ages: string[];
  onToggleAge: (id: string) => void;
  categories: string[];
  onToggleCategory: (id: string) => void;
  when: string | null;
  onWhenChange: (id: string | null) => void;
  onClearFilters: () => void;
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

function CountLabel({ count }: { count: number }) {
  return (
    <p className="text-sm font-medium text-foreground">
      {count} {count === 1 ? "atividade encontrada" : "atividades encontradas"}
    </p>
  );
}

function ClearFiltersButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 text-sm font-medium text-muted-foreground underline hover:text-foreground"
    >
      Limpar filtros
    </button>
  );
}

// Own component (not inlined in ActivityFilters) so it gets its own open/query
// state — the desktop and mobile-drawer layouts both render `filterGroups`,
// and if this lived directly in ActivityFilters, both copies would share one
// `useState`, so opening the dropdown in one layout would also pop the
// other's PopoverContent open in a Portal outside the CSS-hidden trigger.
//
// The visible "Buscar cidade" field IS the search input (no second, hidden
// input inside the popover) — it doubles as the combobox trigger (via
// PopoverAnchor, so focusing/typing opens it without the click-to-toggle
// behavior a real PopoverTrigger would add) and the live filter query.
function CityCombobox({
  cities,
  city,
  onCityChange,
}: {
  cities: string[];
  city: string | null;
  onCityChange: (city: string | null) => void;
}) {
  const [query, setQuery] = useState(city ?? "");
  const [open, setOpen] = useState(false);

  // Reflects external changes (e.g. the top-level "Limpar filtros" button)
  // while this stays mounted — but not while the user is actively editing.
  useEffect(() => {
    if (!open) setQuery(city ?? "");
  }, [city, open]);

  const suggestions = useMemo(() => {
    const q = normalizeText(query.trim());
    if (!q) return cities;
    return cities.filter((c) => normalizeText(c).includes(q));
  }, [cities, query]);

  const selectCity = (c: string) => {
    onCityChange(c);
    setQuery(c);
    setOpen(false);
  };

  return (
    <>
      {/* modal: without it, Vaul's drawer focus trap (when this renders inside
          the mobile filter sheet) fights the popover for focus and closes it
          the instant it opens. */}
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          // Closed without picking a suggestion (outside click, Escape) —
          // drop whatever was typed and show the actually-applied filter again.
          if (!next) setQuery(city ?? "");
        }}
        modal
      >
        <PopoverAnchor asChild>
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              role="combobox"
              aria-expanded={open}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!open) setOpen(true);
              }}
              onFocus={(e) => {
                setOpen(true);
                e.target.select();
              }}
              onKeyDown={(e) => {
                const first = suggestions[0];
                if (e.key === "Enter" && first !== undefined) {
                  e.preventDefault();
                  selectCity(first);
                }
              }}
              placeholder="Buscar cidade"
              className="w-full rounded-full border border-border bg-background py-1.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
        </PopoverAnchor>
        <PopoverContent
          className="z-[1300] w-[240px] p-1 shadow-lg"
          align="start"
          sideOffset={6}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {suggestions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma cidade encontrada.
            </p>
          ) : (
            <div role="listbox" className="max-h-[300px] overflow-y-auto">
              {suggestions.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="option"
                  aria-selected={city === c}
                  onClick={() => selectCity(c)}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                >
                  <Check className={cn("h-4 w-4 shrink-0", city === c ? "opacity-100" : "opacity-0")} />
                  {c}
                </button>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>
      {city !== null && (
        <button
          type="button"
          onClick={() => {
            onCityChange(null);
            setQuery("");
          }}
          className="rounded-full px-3 py-1.5 text-sm text-muted-foreground underline"
        >
          Limpar
        </button>
      )}
    </>
  );
}

export default function ActivityFilters({
  radius,
  onRadiusChange,
  onLocateMe,
  hasCenter,
  cities,
  city,
  onCityChange,
  ages,
  onToggleAge,
  categories,
  onToggleCategory,
  when,
  onWhenChange,
  onClearFilters,
  count,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const drawerContentRef = useRef<HTMLDivElement>(null);

  const activeFilterCount =
    (radius !== null ? 1 : 0) +
    ages.length +
    categories.length +
    (when !== null ? 1 : 0) +
    (city !== null ? 1 : 0);

  const filterGroups = (
    <>
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
        <CityCombobox cities={cities} city={city} onCityChange={onCityChange} />
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
    </>
  );

  return (
    <>
      {/* Desktop / tablet: full filter bar, always expanded */}
      <section className="hidden space-y-3 border-b border-border bg-card px-4 py-3 md:block">
        {filterGroups}
        <div className="flex items-center justify-between gap-3">
          <CountLabel count={count} />
          {activeFilterCount > 0 && <ClearFiltersButton onClick={onClearFilters} />}
        </div>
      </section>

      {/* Mobile: compact bar that opens the filters as a bottom sheet */}
      <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 md:hidden">
        <CountLabel count={count} />
        <Drawer open={mobileOpen} onOpenChange={setMobileOpen}>
          <DrawerTrigger asChild>
            <button
              ref={mobileTriggerRef}
              type="button"
              className="relative flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
              {activeFilterCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </DrawerTrigger>
          <DrawerContent
            ref={drawerContentRef}
            className="max-h-[85vh]"
            onOpenAutoFocus={(event) => {
              // vaul defaults to leaving focus on the trigger, which leaves it
              // inside the now aria-hidden background once the sheet opens.
              // Move it to the first focusable field in the sheet instead.
              event.preventDefault();
              const target = drawerContentRef.current?.querySelector<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
              );
              (target ?? drawerContentRef.current)?.focus();
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              mobileTriggerRef.current?.focus();
            }}
          >
            <DrawerHeader className="flex items-center justify-between gap-2 space-y-0">
              <DrawerTitle>Filtros</DrawerTitle>
              {activeFilterCount > 0 && <ClearFiltersButton onClick={onClearFilters} />}
            </DrawerHeader>
            <div className="space-y-4 overflow-y-auto px-4 pb-2">{filterGroups}</div>
            <DrawerFooter>
              <DrawerClose asChild>
                <button
                  type="button"
                  className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Ver {count} {count === 1 ? "atividade" : "atividades"}
                </button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}
