import { useEffect, useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
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
}: {
  cities: string[];
  city: string | null;
  onCityChange: (city: string | null) => void;
}) {
  const [query, setQuery] = useState(city ?? "");
  const [open, setOpen] = useState(false);

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
              placeholder="Buscar comuna"
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
