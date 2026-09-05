import { toast } from "sonner";
import { useActivityInterest } from "@/hooks/use-activity-interest";

type InterestButtonProps = {
  activityId: string;
  size?: "sm" | "md";
};

function formatInterestCount(count: number) {
  return count === 1 ? "1 família interessada" : `${count} famílias interessadas`;
}

export default function InterestButton({ activityId, size = "md" }: InterestButtonProps) {
  const { count, interested, submitting, markInterest } = useActivityInterest(activityId);
  const isCompact = size === "sm";

  const handleClick = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const ok = await markInterest();
    if (ok === false) {
      toast.error("Não foi possível registrar seu interesse. Tente de novo.");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={interested || submitting}
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors disabled:cursor-default ${
          isCompact ? "px-2.5 py-1 text-xs" : "px-4 py-2 text-sm"
        } ${
          interested
            ? "border-red-200 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
            : "border-border bg-background text-foreground hover:bg-muted"
        }`}
      >
        {interested ? "Interesse registrado ❤️" : "Tenho interesse ❤️"}
      </button>
      {count !== null && (
        <span
          className={
            isCompact ? "text-[11px] text-muted-foreground" : "text-sm text-muted-foreground"
          }
        >
          {formatInterestCount(count)}
        </span>
      )}
    </div>
  );
}
