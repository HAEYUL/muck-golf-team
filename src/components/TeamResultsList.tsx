import { TEAM_THEMES } from "@/lib/types";
import { sortIdsByOrder } from "@/lib/sort";

export function TeamResultsList({
  teams,
  getName,
  memberOrder,
}: {
  teams: Record<string, string[]>;
  getName: (memberId: string) => string;
  /** 나이순으로 정렬된 전체 멤버 id 목록. 각 조 안 이름을 이 순서로 보여준다 */
  memberOrder: string[];
}) {
  return (
    <div className="flex flex-col gap-3">
      {Object.entries(teams).map(([teamNo, ids]) => {
        const theme = TEAM_THEMES[Number(teamNo) - 1] ?? TEAM_THEMES[0];
        const sortedIds = sortIdsByOrder(ids, memberOrder);
        return (
          <div
            key={teamNo}
            className="rounded-xl p-3"
            style={{ background: `${theme.color}1a`, border: `2px solid ${theme.color}` }}
          >
            <p className="font-extrabold" style={{ color: theme.color }}>
              {theme.name} ({sortedIds.length}명)
            </p>
            <p className="mt-1 text-foreground/80">{sortedIds.map(getName).join(", ")}</p>
          </div>
        );
      })}
    </div>
  );
}
