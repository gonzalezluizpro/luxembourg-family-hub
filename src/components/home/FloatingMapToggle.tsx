import { List, Map as MapIcon } from "lucide-react";
import type { ViewMode } from "@/hooks/use-explore-state";

type Props = {
  view: ViewMode;
  onToggle: () => void;
};

export default function FloatingMapToggle({ view, onToggle }: Props) {
  const showingMap = view === "map";

  return (
    <button
      type="button"
      onClick={onToggle}
      // bottom-24: clears the fixed cookie-consent banner (also bottom-anchored,
      // see CookieConsentBanner) instead of sitting behind/under it.
      className="fixed bottom-24 left-1/2 z-[1100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background shadow-lg transition-transform hover:scale-105 active:scale-95"
    >
      {showingMap ? (
        <>
          <List className="h-4 w-4" />
          Ver lista
        </>
      ) : (
        <>
          <MapIcon className="h-4 w-4" />
          Ver no mapa
        </>
      )}
    </button>
  );
}
