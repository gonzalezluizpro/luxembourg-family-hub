import { useEffect, useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { normalizeText } from "@/lib/text";
import { cn } from "@/lib/utils";

export type RadiusOption = 5 | 10 | 20 | null;

// Own component so it gets its own open/query state — if a caller renders
// this in more than one place at once (e.g. desktop + mobile layouts), each
// copy needs independent state or opening one would also pop open the
// other's PopoverContent in a Portal outside its CSS-hidden trigger.
//
// The visible "Buscar cidade" field IS the search input (no second, hidden
// input inside the popover) — it doubles as the combobox trigger (via
// PopoverAnchor, so focusing/typing opens it without the click-to-toggle
// behavior a real PopoverTrigger would add) and the live filter query.
export default function CityCombobox({
  cities,
  city,
  onCityChange,
  variant = "field",
}: {
  cities: string[];
  city: string | null;
  onCityChange: (city: string | null) => void;
  // "field": a self-contained bordered input with a search icon, for the
  // mobile bar where it stands alone. "segment": borderless and icon-less so
  // it reads as one cell of the desktop segmented bar, its text aligned under
  // the segment's own "Comuna" label rather than behind a nested box.
  variant?: "field" | "segment";
}) {
  const [query, setQuery] = useState(city ?? "");
  const [open, setOpen] = useState(false);
  const isSegment = variant === "segment";

  // Reflects external changes (e.g. a top-level "Limpar filtros" button)
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
          a mobile bottom sheet) fights the popover for focus and closes it
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
          <div className="relative w-full">
            {!isSegment && (
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            )}
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
              placeholder="Buscar comuna"
              className={cn(
                "w-full text-sm outline-none transition-colors",
                isSegment
                  ? "border-0 bg-transparent p-0 font-medium text-foreground placeholder:font-normal placeholder:text-muted-foreground"
                  : "rounded-lg border border-border bg-background py-2 pl-9 focus:border-primary",
                city !== null && (isSegment ? "pr-6" : "pr-9"),
                city === null && !isSegment && "pr-3",
              )}
            />
            {city !== null && (
              <button
                type="button"
                aria-label="Limpar comuna"
                onClick={() => {
                  onCityChange(null);
                  setQuery("");
                }}
                className={cn(
                  "absolute top-1/2 flex -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  isSegment ? "right-0 h-5 w-5" : "right-1.5 h-6 w-6",
                )}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </PopoverAnchor>
        <PopoverContent
          className="z-[1300] w-[240px] rounded-lg p-1 shadow-lg"
          align="start"
          sideOffset={6}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {suggestions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma comuna encontrada.
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
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                >
                  <Check className={cn("h-4 w-4 shrink-0", city === c ? "opacity-100" : "opacity-0")} />
                  {c}
                </button>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </>
  );
}
