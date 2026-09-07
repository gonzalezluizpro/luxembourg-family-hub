import { useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, SlidersHorizontal } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  count,
}: Props) {
  const [cityQuery, setCityQuery] = useState("");
  const [cityPopoverOpen, setCityPopoverOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const drawerContentRef = useRef<HTMLDivElement>(null);

  const citySuggestions = useMemo(() => {
    const q = normalizeText(cityQuery.trim());
    if (!q) return cities;
    return cities.filter((c) => normalizeText(c).includes(q));
  }, [cities, cityQuery]);

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
        <Popover open={cityPopoverOpen} onOpenChange={setCityPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              role="combobox"
              aria-expanded={cityPopoverOpen}
              className="flex min-w-[200px] flex-1 items-center justify-between gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
            >
              <span className={city ? "text-foreground" : "text-muted-foreground"}>
                {city ?? "Buscar cidade"}
              </span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[240px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Buscar cidade..."
                value={cityQuery}
                onValueChange={setCityQuery}
              />
              <CommandList>
                <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                <CommandGroup>
                  {citySuggestions.map((c) => (
                    <CommandItem
                      key={c}
                      value={c}
                      onSelect={() => {
                        onCityChange(c);
                        setCityQuery("");
                        setCityPopoverOpen(false);
                      }}
                    >
                      <Check
                        className={cn("h-4 w-4", city === c ? "opacity-100" : "opacity-0")}
                      />
                      {c}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {city !== null && (
          <button
            type="button"
            onClick={() => {
              onCityChange(null);
              setCityQuery("");
            }}
            className="rounded-full px-3 py-1.5 text-sm text-muted-foreground underline"
          >
            Limpar
          </button>
        )}
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
        <CountLabel count={count} />
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
            <DrawerHeader>
              <DrawerTitle>Filtros</DrawerTitle>
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
