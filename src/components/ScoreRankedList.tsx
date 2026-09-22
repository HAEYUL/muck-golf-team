import { TEAM_THEMES } from "@/lib/types";
import { sortIdsByOrder } from "@/lib/sort";
import type { RoundScore } from "@/lib/types";

export function ScoreRankedList({
  scores,
  getName,
  assignedMemberIds,
  teams,
  memberOrder,
}: {
  scores: RoundScore[];
  getName: (memberId: string) => string;
  /** 이번 라운딩에 배정된 전체 인원. 넘기면 스코어 미입력자도 "미입력"으로 함께 표시한다 */
  assignedMemberIds?: string[];
  /** 조편성 결과. 있으면 점수순 대신 조별로 묶어서 보여준다 */
  teams?: Record<string, string[]>;
  /** 나이순으로 정렬된 전체 멤버 id 목록. 각 조 안 순서를 이 순서로 보여준다 */
  memberOrder?: string[];
}) {
  const scoreByMember = new Map(scores.map((s) => [s.member_id, s.score]));

  function renderRow(id: string) {
    const score = scoreByMember.get(id);
    return (
      <div key={id} className="flex items-center justify-between">
        <span>{getName(id)}</span>
        {score !== undefined ? (
          <span className="font-bold">{score}타</span>
        ) : (
          <span className="text-sm text-foreground/40">미입력</span>
        )}
      </div>
    );
  }

  if (teams && Object.keys(teams).length > 0) {
    const teamNos = Object.keys(teams).sort((a, b) => Number(a) - Number(b));
    return (
      <div className="flex flex-col gap-3">
        {teamNos.map((teamNo) => {
          const theme = TEAM_THEMES[Number(teamNo) - 1] ?? TEAM_THEMES[0];
          const sortedIds = sortIdsByOrder(teams[teamNo], memberOrder ?? []);
          return (
            <div key={teamNo} className="flex flex-col gap-1">
              <p className="text-sm font-extrabold" style={{ color: theme.color }}>
                {theme.name}
              </p>
              <div className="flex flex-col gap-1 pl-1">{sortedIds.map(renderRow)}</div>
            </div>
          );
        })}
      </div>
    );
  }

  const fallbackIds = assignedMemberIds ?? scores.map((s) => s.member_id);
  const ids = memberOrder ? sortIdsByOrder(fallbackIds, memberOrder) : fallbackIds;

  return <div className="flex flex-col gap-1">{ids.map(renderRow)}</div>;
}
