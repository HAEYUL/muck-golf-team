import type { RoundScore } from "@/lib/types";
import { MEDALS, rankTopScores } from "@/lib/ranking";

export function ScoreRankedList({
  scores,
  averageByMember,
  getName,
  assignedMemberIds,
}: {
  scores: RoundScore[];
  averageByMember: Record<string, number>;
  getName: (memberId: string) => string;
  /** 이번 라운딩에 배정된 전체 인원. 넘기면 스코어 미입력자도 "미입력"으로 함께 표시한다 */
  assignedMemberIds?: string[];
}) {
  const ranked = rankTopScores(scores, averageByMember, scores.length);
  const scoredIds = new Set(scores.map((s) => s.member_id));
  const unscoredIds = (assignedMemberIds ?? []).filter((id) => !scoredIds.has(id));

  return (
    <div className="flex flex-col gap-1">
      {ranked.map((s, idx) => (
        <div key={s.id} className="flex items-center justify-between">
          <span>
            {MEDALS[idx] ?? `${idx + 1}.`} {getName(s.member_id)}
          </span>
          <span className="font-bold">{s.score}타</span>
        </div>
      ))}
      {unscoredIds.map((id) => (
        <div key={id} className="flex items-center justify-between text-foreground/40">
          <span>{getName(id)}</span>
          <span className="text-sm">미입력</span>
        </div>
      ))}
    </div>
  );
}
