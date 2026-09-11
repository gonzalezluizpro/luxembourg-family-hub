import { CATEGORY_ICONS, CATEGORY_KEYS, CATEGORY_LABELS } from "@/lib/activity-categories";

type Props = {
  categories: string[];
  onToggleCategory: (id: string) => void;
};

export default function CategoryRail({ categories, onToggleCategory }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto border-b border-border bg-background px-4 py-3">
      {CATEGORY_KEYS.map((key) => {
        const active = categories.includes(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggleCategory(key)}
            className={`flex shrink-0 flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span className="text-xl leading-none">{CATEGORY_ICONS[key]}</span>
            {CATEGORY_LABELS[key]}
          </button>
        );
      })}
    </div>
  );
}
