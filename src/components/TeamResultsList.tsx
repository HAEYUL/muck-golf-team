import { TEAM_THEMES } from "@/lib/types";

export function TeamResultsList({
  teams,
  getName,
}: {
  teams: Record<string, string[]>;
  getName: (memberId: string) => string;
}) {
  return (
    <div className="flex flex-col gap-3">
      {Object.entries(teams).map(([teamNo, ids]) => {
        const theme = TEAM_THEMES[Number(teamNo) - 1] ?? TEAM_THEMES[0];
        return (
          <div
            key={teamNo}
            className="rounded-xl p-3"
            style={{ background: `${theme.color}1a`, border: `2px solid ${theme.color}` }}
          >
            <p className="font-extrabold" style={{ color: theme.color }}>
              {theme.name} ({ids.length}명)
            </p>
            <p className="mt-1 text-foreground/80">{ids.map(getName).join(", ")}</p>
          </div>
        );
      })}
    </div>
  );
}
