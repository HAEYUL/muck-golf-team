import type { RoundScore } from "./types";

/**
 * 타수가 낮은 순으로 상위 N명을 뽑는다. 타수가 동점이면
 * 해당 멤버의 전체 라운딩 누적 평균 타수가 더 낮은(잘 치는) 사람을 우선한다.
 */
export function rankTopScores(
  scores: RoundScore[],
  averageByMember: Record<string, number>,
  limit = 3
): RoundScore[] {
  return [...scores]
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      const avgA = averageByMember[a.member_id] ?? Infinity;
      const avgB = averageByMember[b.member_id] ?? Infinity;
      return avgA - avgB;
    })
    .slice(0, limit);
}

export const MEDALS = ["🥇", "🥈", "🥉"] as const;
