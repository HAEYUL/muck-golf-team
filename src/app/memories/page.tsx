import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/session";
import {
  getLatestTeamAssignment,
  getRoundResult,
  listCompletedRounds,
  listMembers,
  listScores,
} from "@/lib/queries";
import { formatDate } from "@/lib/format";
import { TEAM_THEMES } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MemoriesPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/");

  const [rounds, members] = await Promise.all([listCompletedRounds(), listMembers()]);
  const memberMap = new Map(members.map((m) => [m.id, m]));

  const cards = await Promise.all(
    rounds.map(async (round) => {
      const [assignment, scores, result] = await Promise.all([
        getLatestTeamAssignment(round.id),
        listScores(round.id),
        getRoundResult(round.id),
      ]);
      return { round, assignment, scores, result };
    })
  );

  return (
    <main className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-fairway">
          ← 홈으로
        </Link>
        <h1 className="text-xl font-extrabold text-fairway-dark">📸 추억 페이지</h1>
      </header>

      {cards.length === 0 && (
        <p className="text-center text-foreground/60">
          아직 완료된 라운딩이 없어요. 첫 라운딩을 기다려주세요!
        </p>
      )}

      <div className="flex flex-col gap-4">
        {cards.map(({ round, assignment, scores, result }) => {
          const best = [...scores].sort((a, b) => a.score - b.score)[0];
          return (
            <Link
              key={round.id}
              href={`/rounds/${round.id}`}
              className="card flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-lg font-extrabold text-fairway-dark">
                  {round.golf_course}
                </p>
                <span className="text-sm text-foreground/60">{formatDate(round.date)}</span>
              </div>

              {assignment && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(assignment.teams).map(([teamNo, ids]) => {
                    const theme = TEAM_THEMES[Number(teamNo) - 1] ?? TEAM_THEMES[0];
                    return (
                      <span
                        key={teamNo}
                        className="rounded-full px-3 py-1 text-xs font-bold"
                        style={{ background: `${theme.color}22`, color: theme.color }}
                      >
                        {theme.name} {ids.length}명
                      </span>
                    );
                  })}
                </div>
              )}

              {best && (
                <p className="text-sm text-foreground/70">
                  🏆 1등: {memberMap.get(best.member_id)?.name ?? "?"} ({best.score}타)
                </p>
              )}

              {result && result.photos.length > 0 && (
                <div className="grid grid-cols-4 gap-1.5">
                  {result.photos.slice(0, 4).map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={url}
                      src={url}
                      alt="라운딩 사진"
                      className="aspect-square rounded-lg object-cover"
                    />
                  ))}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </main>
  );
}
