import { ROUND_STATUS_STEPS, type RoundStatus } from "@/lib/types";

export function RoundProgressSteps({ status }: { status: RoundStatus }) {
  const currentIndex = ROUND_STATUS_STEPS.indexOf(status);

  return (
    <div className="flex items-center">
      {ROUND_STATUS_STEPS.map((step, idx) => {
        const done = idx <= currentIndex;
        const isLast = idx === ROUND_STATUS_STEPS.length - 1;
        return (
          <div key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                style={{
                  background: done ? "var(--fairway)" : "var(--sand)",
                  color: done ? "white" : "var(--foreground)",
                  opacity: done ? 1 : 0.6,
                }}
              >
                {idx + 1}
              </div>
              <span
                className="whitespace-nowrap text-[11px] font-semibold"
                style={{ color: done ? "var(--fairway-dark)" : "var(--foreground)", opacity: done ? 1 : 0.5 }}
              >
                {step}
              </span>
            </div>
            {!isLast && (
              <div
                className="mx-1 h-0.5 flex-1"
                style={{ background: idx < currentIndex ? "var(--fairway)" : "var(--sand)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
