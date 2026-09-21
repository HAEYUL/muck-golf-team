import type { RoundScore } from "@/lib/types";
import { MEDALS, rankTopScores } from "@/lib/ranking";

export function ScoreRankedList({
  scores,
  averageByMember,
  getName,
}: {
  scores: RoundScore[];
  averageByMember: Record<string, number>;
  getName: (memberId: string) => string;
}) {
  const ranked = rankTopScores(scores, averageByMember, scores.length);

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
    </div>
  );
}
