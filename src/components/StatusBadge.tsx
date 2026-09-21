import type { RoundStatus } from "@/lib/types";

const STYLES: Record<RoundStatus, string> = {
  모집중: "bg-sky/15 text-sky",
  조편성중: "bg-accent/15 text-accent",
  확정: "bg-fairway/15 text-fairway-dark",
  완료: "bg-foreground/10 text-foreground/60",
};

export function StatusBadge({ status }: { status: RoundStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
